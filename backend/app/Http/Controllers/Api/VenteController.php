<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementStock;
use App\Models\Vente;
use App\Models\VenteDetail;
use App\Models\VentePaiement;
use App\Models\Variante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VenteController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Vente::where('boutique_id', $boutique_id)
                      ->with(['client', 'vendeur', 'details.variante', 'paiements']);

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('vendeur_id')) {
            $query->where('vendeur_id', $request->vendeur_id);
        }

        if ($request->has('debut') && $request->has('fin')) {
            $query->whereBetween('created_at', [$request->debut, $request->fin . ' 23:59:59']);
        }

        return response()->json($query->latest()->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'client_id'              => 'nullable|exists:clients,id',
            'note'                   => 'nullable|string',
            'valider'                => 'boolean',
            'lignes'                 => 'required|array|min:1',
            'lignes.*.variante_id'   => 'required|exists:variantes,id',
            'lignes.*.quantite'      => 'required|integer|min:1',
            'lignes.*.prix_applique' => 'required|numeric|min:0',
            'lignes.*.remise_montant'=> 'nullable|numeric|min:0',
            'paiements'              => 'required_if:valider,true|array',
            'paiements.*.mode'       => 'required|in:especes,mobile_money,credit',
            'paiements.*.montant'    => 'required|numeric|min:0',
            'paiements.*.operateur_id' => 'nullable|exists:referentiels,id',
        ]);

        DB::beginTransaction();

        try {
            // Calcul des totaux
            $totalBrut  = 0;
            $totalRemise = 0;

            $lignesAvecVariantes = [];
            foreach ($data['lignes'] as $ligne) {
                $variante = Variante::where('boutique_id', $boutique_id)
                                    ->findOrFail($ligne['variante_id']);
                $remise = $ligne['remise_montant'] ?? 0;
                $totalBrut   += $ligne['prix_applique'] * $ligne['quantite'];
                $totalRemise += $remise;
                $lignesAvecVariantes[] = ['variante' => $variante, 'ligne' => $ligne, 'remise' => $remise];
            }

            $totalNet = $totalBrut - $totalRemise;
            $valider  = $data['valider'] ?? false;

            // Vérifications si validation
            if ($valider) {
                // Stock suffisant
                foreach ($lignesAvecVariantes as $item) {
                    if ($item['variante']->stock_actuel < $item['ligne']['quantite']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => 'Stock insuffisant pour : ' . $item['variante']->produit->designation ?? $item['variante']->id,
                        ], 422);
                    }
                }

                // Crédit nécessite un client
                $hasModeCredit = collect($data['paiements'] ?? [])->contains('mode', 'credit');
                if ($hasModeCredit && empty($data['client_id'])) {
                    DB::rollBack();
                    return response()->json(['message' => 'Un client est requis pour une vente à crédit'], 422);
                }
            }

            // Créer la vente
            $vente = Vente::create([
                'boutique_id'  => $boutique_id,
                'client_id'    => $data['client_id'] ?? null,
                'vendeur_id'   => auth()->id(),
                'statut'       => 'brouillon',
                'total_brut'   => $totalBrut,
                'total_remise' => $totalRemise,
                'total_net'    => $totalNet,
                'note'         => $data['note'] ?? null,
            ]);

            // Créer les lignes
            foreach ($lignesAvecVariantes as $item) {
                VenteDetail::create([
                    'vente_id'       => $vente->id,
                    'variante_id'    => $item['variante']->id,
                    'quantite'       => $item['ligne']['quantite'],
                    'prix_catalogue' => $item['variante']->prix_vente,
                    'prix_applique'  => $item['ligne']['prix_applique'],
                    'remise_montant' => $item['remise'],
                ]);
            }

            // Valider si demandé
            if ($valider) {
                $this->validerVente($vente, $lignesAvecVariantes, $data['paiements'], $boutique_id);
            }

            DB::commit();

            $request->auditAction = $valider ? 'vente_validee' : 'vente_brouillon';
            $request->auditModule = 'ventes';
            $request->auditDetails = ['vente_id' => $vente->id, 'total_net' => $totalNet];

            return response()->json($vente->fresh()->load(['client', 'vendeur', 'details.variante', 'paiements']), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $vente = Vente::where('boutique_id', $boutique_id)
                      ->with(['client', 'vendeur', 'details.variante.produit', 'paiements'])
                      ->findOrFail($id);

        return response()->json($vente);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $vente = Vente::where('boutique_id', $boutique_id)
                      ->where('statut', 'brouillon')
                      ->findOrFail($id);

        $data = $request->validate([
            'client_id'              => 'nullable|exists:clients,id',
            'note'                   => 'nullable|string',
            'lignes'                 => 'sometimes|array|min:1',
            'lignes.*.variante_id'   => 'required|exists:variantes,id',
            'lignes.*.quantite'      => 'required|integer|min:1',
            'lignes.*.prix_applique' => 'required|numeric|min:0',
            'lignes.*.remise_montant'=> 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            if (isset($data['lignes'])) {
                $vente->details()->delete();

                $totalBrut = $totalRemise = 0;
                foreach ($data['lignes'] as $ligne) {
                    $variante = Variante::where('boutique_id', $boutique_id)->findOrFail($ligne['variante_id']);
                    $remise = $ligne['remise_montant'] ?? 0;
                    $totalBrut   += $ligne['prix_applique'] * $ligne['quantite'];
                    $totalRemise += $remise;

                    VenteDetail::create([
                        'vente_id'       => $vente->id,
                        'variante_id'    => $variante->id,
                        'quantite'       => $ligne['quantite'],
                        'prix_catalogue' => $variante->prix_vente,
                        'prix_applique'  => $ligne['prix_applique'],
                        'remise_montant' => $remise,
                    ]);
                }

                $vente->update([
                    'client_id'    => $data['client_id'] ?? $vente->client_id,
                    'note'         => $data['note'] ?? $vente->note,
                    'total_brut'   => $totalBrut,
                    'total_remise' => $totalRemise,
                    'total_net'    => $totalBrut - $totalRemise,
                ]);
            }

            DB::commit();
            return response()->json($vente->fresh()->load(['client', 'vendeur', 'details.variante', 'paiements']));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function valider(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $vente = Vente::where('boutique_id', $boutique_id)
                      ->where('statut', 'brouillon')
                      ->with('details.variante')
                      ->findOrFail($id);

        $data = $request->validate([
            'paiements'                => 'required|array',
            'paiements.*.mode'         => 'required|in:especes,mobile_money,credit',
            'paiements.*.montant'      => 'required|numeric|min:0',
            'paiements.*.operateur_id' => 'nullable|exists:referentiels,id',
        ]);

        $hasModeCredit = collect($data['paiements'])->contains('mode', 'credit');
        if ($hasModeCredit && !$vente->client_id) {
            return response()->json(['message' => 'Un client est requis pour une vente à crédit'], 422);
        }

        DB::beginTransaction();

        try {
            $lignesAvecVariantes = $vente->details->map(fn($d) => [
                'variante' => $d->variante,
                'ligne'    => ['quantite' => $d->quantite, 'prix_applique' => $d->prix_applique],
                'remise'   => $d->remise_montant,
            ])->toArray();

            // Vérifier stock
            foreach ($vente->details as $detail) {
                if ($detail->variante->stock_actuel < $detail->quantite) {
                    DB::rollBack();
                    return response()->json(['message' => 'Stock insuffisant'], 422);
                }
            }

            $this->validerVente($vente, $lignesAvecVariantes, $data['paiements'], $boutique_id);

            DB::commit();

            $request->auditAction = 'vente_validee';
            $request->auditModule = 'ventes';
            $request->auditDetails = ['vente_id' => $vente->id, 'total_net' => $vente->total_net];

            return response()->json($vente->fresh()->load(['client', 'vendeur', 'details.variante', 'paiements']));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function annuler(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $vente = Vente::where('boutique_id', $boutique_id)
                      ->where('statut', 'validee')
                      ->with('details.variante')
                      ->findOrFail($id);

        DB::beginTransaction();

        try {
            // Réintégrer le stock
            foreach ($vente->details as $detail) {
                $detail->variante->increment('stock_actuel', $detail->quantite);

                MouvementStock::create([
                    'boutique_id' => $boutique_id,
                    'variante_id' => $detail->variante_id,
                    'type'        => 'retour',
                    'quantite'    => $detail->quantite,
                    'source'      => 'retour',
                    'source_id'   => $vente->id,
                    'user_id'     => auth()->id(),
                    'note'        => 'Annulation vente #' . $vente->numero_facture,
                    'created_at'  => now(),
                ]);
            }

            $vente->update(['statut' => 'annulee']);

            DB::commit();

            $request->auditAction = 'vente_annulee';
            $request->auditModule = 'ventes';
            $request->auditDetails = ['vente_id' => $vente->id, 'total_net' => $vente->total_net];

            return response()->json(['message' => 'Vente annulée', 'statut' => 'annulee']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    // Méthode privée partagée pour la validation
    private function validerVente(Vente $vente, array $lignes, array $paiements, int $boutiqueId): void
    {
        // Déduire le stock
        foreach ($lignes as $item) {
            $variante = $item['variante'] instanceof Variante
                ? $item['variante']
                : Variante::find($item['variante']['id']);

            $variante->decrement('stock_actuel', $item['ligne']['quantite']);

            MouvementStock::create([
                'boutique_id' => $boutiqueId,
                'variante_id' => $variante->id,
                'type'        => 'sortie',
                'quantite'    => $item['ligne']['quantite'],
                'source'      => 'vente',
                'source_id'   => $vente->id,
                'user_id'     => auth()->id(),
                'note'        => null,
                'created_at'  => now(),
            ]);
        }

        // Enregistrer les paiements
        foreach ($paiements as $p) {
            VentePaiement::create([
                'vente_id'     => $vente->id,
                'mode'         => $p['mode'],
                'montant'      => $p['montant'],
                'operateur_id' => $p['operateur_id'] ?? null,
            ]);
        }

        // Générer le numéro de facture
        $numeroFacture = Vente::genererNumeroFacture($boutiqueId);

        $vente->update([
            'statut'          => 'validee',
            'numero_facture'  => $numeroFacture,
            'date_validation' => now(),
        ]);
    }
}