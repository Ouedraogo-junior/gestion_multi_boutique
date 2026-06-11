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
    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'fournisseur_id' => 'required|exists:fournisseurs,id',
            'note'           => 'nullable|string',
            'lignes'         => 'required|array|min:1',
            'lignes.*.variante_id' => 'required|exists:variantes,id',
            'lignes.*.quantite'    => 'required|integer|min:1',
            'lignes.*.prix_achat'  => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $appro = Approvisionnement::create([
                'boutique_id'    => $boutique_id,
                'fournisseur_id' => $data['fournisseur_id'],
                'user_id'        => auth()->id(),
                'reference'      => Approvisionnement::genererReference($boutique_id),
                'note'           => $data['note'] ?? null,
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

                // Mettre à jour le prix_achat sur la variante si fourni
                if (!empty($ligne['prix_achat'])) {
                    if ($variante->est_defaut) {
                        // Produit simple → mettre à jour aussi le produit
                        $variante->produit->update(['prix_achat' => $ligne['prix_achat']]);
                    } else {
                        // Produit avec variantes → mettre à jour la variante
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

            // Charger toutes les relations pour le reçu
            $appro->load([
                'fournisseur',
                'user',
                'lignes.variante.produit',
            ]);

            return response()->json($appro, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $appros = Approvisionnement::where('boutique_id', $boutique_id)
                                   ->with(['fournisseur', 'user', 'lignes.variante.produit'])
                                   ->latest()
                                   ->paginate($request->get('per_page', 25));

        return response()->json($appros);
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $appro = Approvisionnement::where('boutique_id', $boutique_id)
                                  ->with(['fournisseur', 'user', 'lignes.variante.produit'])
                                  ->findOrFail($id);

        return response()->json($appro);
    }
}