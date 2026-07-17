<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\MouvementStock;
use App\Models\TransfertBoutique;
use App\Models\TransfertBoutiqueLigne;
use App\Models\Variante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransfertBoutiqueController extends Controller
{
    // Liste des boutiques actives pouvant être destinataires (hors la boutique courante)
    public function boutiquesDisponibles(int $boutique_id): JsonResponse
    {
        $boutiques = Boutique::where('actif', true)
                             ->where('id', '!=', $boutique_id)
                             ->orderBy('nom')
                             ->get(['id', 'nom']);

        return response()->json($boutiques);
    }

    // Liste des transferts — sortants (boutique = source) et/ou entrants (boutique = destination)
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $direction = $request->get('direction', 'source'); // source | destination | tous

        $query = TransfertBoutique::with([
                'boutiqueSource:id,nom',
                'boutiqueDestination:id,nom',
            ])
            ->withSum('paiements', 'montant');

        if ($direction === 'source') {
            $query->where('boutique_source_id', $boutique_id);
        } elseif ($direction === 'destination') {
            $query->where('boutique_destination_id', $boutique_id);
        } else {
            $query->where(function ($q) use ($boutique_id) {
                $q->where('boutique_source_id', $boutique_id)
                ->orWhere('boutique_destination_id', $boutique_id);
            });
        }

        $transferts = $query->latest()->paginate($request->get('per_page', 25));

        $transferts->getCollection()->transform(function ($t) {
            $paye = (float) ($t->paiements_sum_montant ?? 0);
            $du   = (float) ($t->montant_convenu ?? $t->montant_calcule);
            $t->statut_paiement = $paye <= 0 ? 'non_paye' : ($paye >= $du ? 'solde' : 'partiel');
            $t->solde_restant   = max(0, $du - $paye);
            return $t;
        });

        if ($request->has('statut_paiement')) {
            $statut = $request->statut_paiement;
            $filtered = $transferts->getCollection()->filter(
                fn($t) => $t->statut_paiement === $statut
            )->values();
            $transferts->setCollection($filtered);
        }

        return response()->json($transferts);
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'boutique_destination_id'   => 'required|exists:boutiques,id',
            'note'                      => 'nullable|string',
            'montant_convenu'           => 'nullable|numeric|min:0',
            'lignes'                    => 'required|array|min:1',
            'lignes.*.variante_id'      => 'required|exists:variantes,id',
            'lignes.*.quantite'         => 'required|integer|min:1',
            'lignes.*.prix_unitaire'    => 'nullable|numeric|min:0',
            'paiement'                          => 'nullable|array',
            'paiement.montant'                  => 'required_with:paiement|numeric|min:0.01',
            'paiement.mode'                     => 'required_with:paiement|in:especes,mobile_money,avance_client',
            'paiement.operateur_id'             => 'nullable|exists:referentiels,id',
            'paiement.client_avance_id'         => 'required_if:paiement.mode,avance_client|nullable|exists:clients,id',
            'paiement.reference_paiement'       => 'nullable|string|max:100',
            'paiement.date_paiement'            => 'required_with:paiement|date',
            'paiement.note'                     => 'nullable|string',
        ]);

        if ((int) $data['boutique_destination_id'] === $boutique_id) {
            return response()->json(['message' => 'La boutique destinataire doit être différente de la boutique source'], 422);
        }

        if (!empty($data['paiement']) && $data['paiement']['mode'] === 'mobile_money' && empty($data['paiement']['operateur_id'])) {
            return response()->json(['message' => 'Un opérateur est requis pour un paiement mobile money'], 422);
        }

        // Vérification de l'avance AVANT toute écriture, si ce mode est choisi
        $clientAvance = null;
        if (!empty($data['paiement']) && $data['paiement']['mode'] === 'avance_client') {
            $clientAvance = \App\Models\Client::where('boutique_id', $boutique_id)
                ->where('id', $data['paiement']['client_avance_id'])
                ->where('est_boutique', true)
                ->where('represente_boutique_id', $data['boutique_destination_id'])
                ->first();

            if (!$clientAvance) {
                return response()->json(['message' => 'Aucune avance liée à cette boutique destinataire n\'a été trouvée'], 422);
            }

            if ($data['paiement']['montant'] > $clientAvance->solde_avance) {
                return response()->json([
                    'message'      => 'Solde d\'avance insuffisant',
                    'solde_avance' => $clientAvance->solde_avance,
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $lignesAvecVariantes = [];
            foreach ($data['lignes'] as $ligne) {
                $variante = Variante::where('boutique_id', $boutique_id)
                                    ->findOrFail($ligne['variante_id']);

                if ($variante->stock_actuel < $ligne['quantite']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Stock insuffisant pour : ' . ($variante->produit->designation ?? $variante->id),
                    ], 422);
                }

                $lignesAvecVariantes[] = ['variante' => $variante, 'ligne' => $ligne];
            }

            $montantCalcule = collect($data['lignes'])->sum(function ($ligne) {
                return ($ligne['prix_unitaire'] ?? 0) * $ligne['quantite'];
            });

            $montantDu = (float) ($data['montant_convenu'] ?? $montantCalcule);

            if (!empty($data['paiement']) && $data['paiement']['montant'] > $montantDu) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Le paiement initial dépasse le montant du transfert (' . $montantDu . ' FCFA).',
                ], 422);
            }

            $transfert = TransfertBoutique::create([
                'boutique_source_id'      => $boutique_id,
                'boutique_destination_id' => $data['boutique_destination_id'],
                'user_id'                 => auth()->id(),
                'reference'               => TransfertBoutique::genererReference($boutique_id),
                'statut'                  => 'valide',
                'note'                    => $data['note'] ?? null,
                'montant_calcule'         => $montantCalcule,
                'montant_convenu'         => $data['montant_convenu'] ?? null,
            ]);

            foreach ($lignesAvecVariantes as $item) {
                $variante = $item['variante'];
                $ligne    = $item['ligne'];

                TransfertBoutiqueLigne::create([
                    'transfert_boutique_id' => $transfert->id,
                    'variante_id'           => $variante->id,
                    'quantite'              => $ligne['quantite'],
                    'prix_unitaire'         => $ligne['prix_unitaire'] ?? 0,
                ]);

                $variante->decrement('stock_actuel', $ligne['quantite']);

                MouvementStock::create([
                    'boutique_id' => $boutique_id,
                    'variante_id' => $variante->id,
                    'type'        => 'sortie',
                    'quantite'    => $ligne['quantite'],
                    'source'      => 'transfert_boutique',
                    'source_id'   => $transfert->id,
                    'user_id'     => auth()->id(),
                    'note'        => 'Transfert ' . $transfert->reference . ' vers boutique #' . $data['boutique_destination_id'],
                    'created_at'  => now(),
                ]);
            }

            if (!empty($data['paiement'])) {
                \App\Models\PaiementTransfertBoutique::create([
                    'boutique_source_id'    => $boutique_id,
                    'transfert_boutique_id' => $transfert->id,
                    'user_id'               => auth()->id(),
                    'montant'               => $data['paiement']['montant'],
                    'mode'                  => $data['paiement']['mode'],
                    'operateur_id'          => $data['paiement']['operateur_id'] ?? null,
                    'reference_paiement'    => $data['paiement']['reference_paiement'] ?? null,
                    'date_paiement'         => $data['paiement']['date_paiement'],
                    'note'                  => $data['paiement']['note'] ?? null,
                ]);

                if ($data['paiement']['mode'] === 'avance_client') {
                    \App\Models\AvanceClient::create([
                        'boutique_id'           => $boutique_id,
                        'client_id'             => $clientAvance->id,
                        'type'                  => 'utilisation',
                        'montant'               => $data['paiement']['montant'],
                        'transfert_boutique_id' => $transfert->id,
                        'user_id'               => auth()->id(),
                        'note'                  => 'Utilisée pour régler le transfert ' . $transfert->reference,
                        'created_at'            => $data['paiement']['date_paiement'] . ' ' . now()->format('H:i:s'),
                    ]);
                }
            }

            DB::commit();

            $request->auditAction  = 'transfert_boutique_cree';
            $request->auditModule  = 'transferts_boutiques';
            $request->auditDetails = [
                'transfert_id'      => $transfert->id,
                'reference'         => $transfert->reference,
                'destination'       => $data['boutique_destination_id'],
                'montant'           => $montantCalcule,
                'paiement_initial'  => $data['paiement']['montant'] ?? null,
                'paiement_mode'     => $data['paiement']['mode'] ?? null,
            ];

            $transfert->load(['boutiqueSource', 'boutiqueDestination', 'user', 'lignes.variante.produit', 'paiements']);

            return response()->json([
                ...$transfert->toArray(),
                'montant_du'      => $transfert->montant_du,
                'montant_paye'    => $transfert->montant_paye,
                'solde_restant'   => $transfert->solde_restant,
                'statut_paiement' => $transfert->statut_paiement,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $transfert = TransfertBoutique::where(function ($q) use ($boutique_id) {
                $q->where('boutique_source_id', $boutique_id)
                  ->orWhere('boutique_destination_id', $boutique_id);
            })
            ->with(['boutiqueSource', 'boutiqueDestination', 'user', 'lignes.variante.produit', 'paiements.user'])
            ->findOrFail($id);

        return response()->json([
            ...$transfert->toArray(),
            'montant_du'      => $transfert->montant_du,
            'montant_paye'    => $transfert->montant_paye,
            'solde_restant'   => $transfert->solde_restant,
            'statut_paiement' => $transfert->statut_paiement,
        ]);
    }

    // Vérifie la disponibilité d'avance à partir de la boutique destinataire choisie,
    // utilisable AVANT la création du transfert (contrairement à avanceDisponible() qui a besoin d'un transfert existant)
    public function avanceDisponiblePourBoutique(int $boutique_id, int $boutique_destination_id): JsonResponse
    {
        $client = \App\Models\Client::where('boutique_id', $boutique_id)
            ->where('est_boutique', true)
            ->where('represente_boutique_id', $boutique_destination_id)
            ->first();

        if (!$client) {
            return response()->json(['disponible' => false]);
        }

        return response()->json([
            'disponible'   => true,
            'client_id'    => $client->id,
            'client_nom'   => trim($client->prenom . ' ' . $client->nom),
            'solde_avance' => $client->solde_avance,
        ]);
    }

    // Vérifie la disponibilité d'avance pour un transfert DÉJÀ CRÉÉ,
    // utilisée par le drawer de paiement (PaiementTransfertDrawer)
    public function avanceDisponible(int $boutique_id, int $id): JsonResponse
    {
        $transfert = TransfertBoutique::where('boutique_source_id', $boutique_id)
                                    ->findOrFail($id);

        $client = \App\Models\Client::where('boutique_id', $boutique_id)
            ->where('est_boutique', true)
            ->where('represente_boutique_id', $transfert->boutique_destination_id)
            ->first();

        if (!$client) {
            return response()->json(['disponible' => false]);
        }

        return response()->json([
            'disponible'   => true,
            'client_id'    => $client->id,
            'client_nom'   => trim($client->prenom . ' ' . $client->nom),
            'solde_avance' => $client->solde_avance,
        ]);
    }
}