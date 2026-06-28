<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approvisionnement;
use App\Models\ApprovisionnementLigne;
use App\Models\MouvementStock;
use App\Models\Variante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovisionnementController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $appros = Approvisionnement::where('boutique_id', $boutique_id)
                                ->with(['fournisseur', 'user', 'lignes.variante.produit'])
                                ->withSum('paiements', 'montant')
                                ->latest()
                                ->paginate($request->get('per_page', 100));

        // Injecter statut_paiement sur chaque item
        $appros->getCollection()->transform(function ($a) {
            $paye = (float) ($a->paiements_sum_montant ?? 0);
            $du   = (float) ($a->montant_total_facture ?? $a->montant_calcule);
            $a->statut_paiement = $paye <= 0 ? 'non_paye' : ($paye >= $du ? 'solde' : 'partiel');
            $a->solde_restant   = max(0, $du - $paye);
            return $a;
        });

        // Filtre par statut_paiement appliqué en PHP
        if ($request->has('statut_paiement')) {
            $statut = $request->statut_paiement;
            $filtered = $appros->getCollection()->filter(
                fn($a) => $a->statut_paiement === $statut
            )->values();
            $appros->setCollection($filtered);
        }

        return response()->json($appros);
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'fournisseur_id'        => 'required|exists:fournisseurs,id',
            'note'                  => 'nullable|string',
            'montant_total_facture' => 'nullable|numeric|min:0',
            'lignes'                => 'required|array|min:1',
            'lignes.*.variante_id'  => 'required|exists:variantes,id',
            'lignes.*.quantite'     => 'required|integer|min:1',
            'lignes.*.prix_achat'   => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Calcul automatique du montant
            $montantCalcule = collect($data['lignes'])->sum(function ($ligne) {
                return ($ligne['prix_achat'] ?? 0) * $ligne['quantite'];
            });

            $appro = Approvisionnement::create([
                'boutique_id'           => $boutique_id,
                'fournisseur_id'        => $data['fournisseur_id'],
                'user_id'               => auth()->id(),
                'reference'             => Approvisionnement::genererReference($boutique_id),
                'statut'                => 'valide',
                'note'                  => $data['note'] ?? null,
                'montant_calcule'       => $montantCalcule,
                'montant_total_facture' => $data['montant_total_facture'] ?? null,
            ]);

            foreach ($data['lignes'] as $ligne) {
                $variante = Variante::where('boutique_id', $boutique_id)
                                    ->findOrFail($ligne['variante_id']);

                ApprovisionnementLigne::create([
                    'approvisionnement_id' => $appro->id,
                    'variante_id'          => $variante->id,
                    'quantite'             => $ligne['quantite'],
                    'prix_achat'           => $ligne['prix_achat'] ?? 0,
                ]);

                if (!empty($ligne['prix_achat'])) {
                    if ($variante->est_defaut) {
                        $variante->produit->update(['prix_achat' => $ligne['prix_achat']]);
                    } else {
                        $variante->update(['prix_achat' => $ligne['prix_achat']]);
                    }
                }

                $variante->increment('stock_actuel', $ligne['quantite']);

                MouvementStock::create([
                    'boutique_id' => $boutique_id,
                    'variante_id' => $variante->id,
                    'type'        => 'entree',
                    'quantite'    => $ligne['quantite'],
                    'source'      => 'approvisionnement',
                    'source_id'   => $appro->id,
                    'user_id'     => auth()->id(),
                    'note'        => 'Approvisionnement ' . $appro->reference,
                    'created_at'  => now(),
                ]);
            }

            DB::commit();

            $appro->load(['fournisseur', 'user', 'lignes.variante.produit']);

            return response()->json($appro, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $appro = Approvisionnement::where('boutique_id', $boutique_id)
                                  ->with(['fournisseur', 'user', 'lignes.variante.produit', 'paiements.modePaiement', 'paiements.user'])
                                  ->findOrFail($id);

        return response()->json([
            ...$appro->toArray(),
            'montant_du'       => $appro->montant_du,
            'montant_paye'     => $appro->montant_paye,
            'solde_restant'    => $appro->solde_restant,
            'statut_paiement'  => $appro->statut_paiement,
        ]);
    }
}