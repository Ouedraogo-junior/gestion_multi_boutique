<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementStock;
use App\Models\Produit;
use App\Models\Variante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Fournisseur;

class ProduitController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Produit::where('boutique_id', $boutique_id)
                        ->with(['categorie', 'variantes']);

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        if ($request->has('categorie_id')) {
            $query->where('categorie_id', $request->categorie_id);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('designation', 'like', '%' . $request->search . '%')
                  ->orWhere('reference', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'designation'              => 'required|string|max:200',
            'categorie_id'             => 'nullable|exists:referentiels,id',
            'prix_achat'               => 'nullable|numeric|min:0',
            'prix_vente'               => 'required|numeric|min:0',
            'description'              => 'nullable|string',
            'etat'                     => 'required|in:neuf,occasion',
            'fournisseur_nom'          => 'nullable|string|max:150',
            'fournisseur_contact'      => 'nullable|string|max:100',
            'fournisseur_telephone'    => 'nullable|string|max:30',
            'fournisseur_notes'        => 'nullable|string',
            'seuil_alerte'             => 'nullable|integer|min:0',
            'has_variantes'            => 'required|boolean',
            'variantes'                => 'required_if:has_variantes,true|array',
            'variantes.*.attributs'    => 'required|array',
            'variantes.*.prix_achat'   => 'nullable|numeric|min:0',
            'variantes.*.prix_vente'   => 'nullable|numeric|min:0',
            'variantes.*.seuil_alerte' => 'nullable|integer|min:0',
            'variantes.*.stock_initial'=> 'nullable|integer|min:0',  // ← ajouté
        ]);

        DB::beginTransaction();

        try {

            if (!empty($data['fournisseur_nom'])) {
                Fournisseur::firstOrCreate(
                    [
                        'boutique_id' => $boutique_id,
                        'nom'         => $data['fournisseur_nom'],
                    ],
                    [
                        'telephone'  => $data['fournisseur_telephone'] ?? null,
                        'adresse'    => $data['fournisseur_contact']   ?? null,
                        'provenance' => null,
                        'notes'      => $data['fournisseur_notes']     ?? null,
                        'actif'      => true,
                    ]
                );
            }

            $produit = Produit::create([
                ...$data,
                'boutique_id' => $boutique_id,
                'reference'   => Produit::genererReference($boutique_id),
            ]);

            // Si has_variantes = true, créer les variantes manuellement
            if ($produit->has_variantes && !empty($data['variantes'])) {
                $variantesRequest = $request->input('variantes', []);
                foreach ($variantesRequest as $v) {
                    $stockInitial = isset($v['stock_initial']) ? (int) $v['stock_initial'] : 0;

                    $variante = Variante::create([
                        'produit_id'   => $produit->id,
                        'boutique_id'  => $boutique_id,
                        'attributs'    => $v['attributs'],
                        'prix_achat'   => $v['prix_achat'] ?? null,
                        'prix_vente'   => $v['prix_vente'] ?? $produit->prix_vente,
                        'stock_actuel' => $stockInitial,
                        'seuil_alerte' => $v['seuil_alerte'] ?? $produit->seuil_alerte,
                        'est_defaut'   => false,
                    ]);

                    if ($stockInitial > 0) {
                        MouvementStock::create([
                            'boutique_id' => $boutique_id,
                            'variante_id' => $variante->id,
                            'type'        => 'entree',
                            'quantite'    => $stockInitial,
                            'source'      => 'approvisionnement',
                            'user_id'     => auth()->id(),
                            'note'        => 'Stock initial',
                            'created_at'  => now(),
                        ]);
                    }
                }
            }
            // Si has_variantes = false, l'observer crée la variante par défaut

            DB::commit();

            // Si has_variantes = false, mettre à jour le stock de la variante par défaut
            if (!$produit->has_variantes && isset($request->stock_initial) && $request->stock_initial > 0) {
                $variante = $produit->variantes()->where('est_defaut', true)->first();
                if ($variante) {
                    $variante->increment('stock_actuel', $request->stock_initial);
                    MouvementStock::create([
                        'boutique_id' => $boutique_id,
                        'variante_id' => $variante->id,
                        'type'        => 'entree',
                        'quantite'    => $request->stock_initial,
                        'source'      => 'approvisionnement',
                        'user_id'     => auth()->id(),
                        'note'        => 'Stock initial',
                        'created_at'  => now(),
                    ]);
                }
            }

            $request->auditAction  = 'produit_cree';
            $request->auditModule  = 'produits';
            $request->auditDetails = ['apres' => $produit->toArray()];

            return response()->json($produit->load('variantes'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $produit = Produit::where('boutique_id', $boutique_id)
                          ->with(['categorie', 'variantes'])
                          ->findOrFail($id);

        return response()->json($produit);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $produit = Produit::where('boutique_id', $boutique_id)->findOrFail($id);
        $avant = $produit->toArray();

        $data = $request->validate([
            'designation'              => 'sometimes|string|max:200',
            'categorie_id'             => 'nullable|exists:referentiels,id',
            'prix_achat'               => 'nullable|numeric|min:0',
            'prix_vente'               => 'sometimes|numeric|min:0',
            'description'              => 'nullable|string',
            'etat'                     => 'sometimes|in:neuf,occasion',
            'fournisseur_nom'          => 'nullable|string|max:150',
            'fournisseur_contact'      => 'nullable|string|max:100',
            'fournisseur_telephone'    => 'nullable|string|max:30',
            'fournisseur_notes'        => 'nullable|string',
            'seuil_alerte'             => 'nullable|integer|min:0',
            'variantes'                => 'sometimes|array',
            'variantes.*.id'           => 'required|exists:variantes,id',
            'variantes.*.prix_achat'   => 'nullable|numeric|min:0',
            'variantes.*.prix_vente'   => 'nullable|numeric|min:0',
            'variantes.*.seuil_alerte' => 'nullable|integer|min:0',
            'variantes.*.attributs'    => 'sometimes|array',
        ]);

        DB::beginTransaction();
        try {
            $produit->update(collect($data)->except('variantes')->toArray());

            // Produit SANS variantes : la variante par défaut doit suivre le prix du produit,
            // sinon elle garde l'ancien prix — c'est elle qui est réellement utilisée en vente.
            if (!$produit->has_variantes) {
                $varianteDefaut = $produit->variantes()->where('est_defaut', true)->first();
                if ($varianteDefaut) {
                    $varianteDefaut->update([
                        'prix_vente'   => $data['prix_vente']   ?? $varianteDefaut->prix_vente,
                        'prix_achat'   => $data['prix_achat']   ?? $varianteDefaut->prix_achat,
                        'seuil_alerte' => $data['seuil_alerte'] ?? $varianteDefaut->seuil_alerte,
                    ]);
                }
            }

            if (!empty($data['variantes'])) {
                foreach ($data['variantes'] as $v) {
                    $variante = Variante::where('boutique_id', $boutique_id)
                                        ->where('produit_id', $produit->id)
                                        ->findOrFail($v['id']);

                    $ancienPrix = $variante->prix_vente;

                    $variante->update([
                        'attributs'    => $v['attributs']    ?? $variante->attributs,
                        'prix_achat'   => $v['prix_achat']   ?? $variante->prix_achat,
                        'prix_vente'   => $v['prix_vente']   ?? $variante->prix_vente,
                        'seuil_alerte' => $v['seuil_alerte'] ?? $variante->seuil_alerte,
                    ]);

                    if (isset($v['prix_vente']) && $v['prix_vente'] != $ancienPrix) {
                        // audit prix_modifie déjà géré par updateVariante,
                        // ici on le logue dans le contexte de la mise à jour produit
                    }
                }
            }

            DB::commit();

            $request->auditAction  = 'produit_modifie';
            $request->auditModule  = 'produits';
            $request->auditDetails = ['avant' => $avant, 'apres' => $produit->fresh()->toArray()];

            return response()->json($produit->fresh()->load('variantes'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    // Correction manuelle du stock — remplace la valeur actuelle par une valeur exacte,
    // contrairement à entreeStock() qui ne fait qu'additionner.
    public function ajusterStock(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'variante_id'   => 'required|exists:variantes,id',
            'nouveau_stock' => 'required|integer|min:0',
            'note'          => 'required|string|min:3',
        ]);

        $variante = Variante::where('boutique_id', $boutique_id)->findOrFail($data['variante_id']);

        $ancienStock = $variante->stock_actuel;
        $ecart       = $data['nouveau_stock'] - $ancienStock;

        if ($ecart === 0) {
            return response()->json(['message' => 'Le nouveau stock est identique au stock actuel'], 422);
        }

        DB::beginTransaction();
        try {
            $variante->update(['stock_actuel' => $data['nouveau_stock']]);

            MouvementStock::create([
                'boutique_id' => $boutique_id,
                'variante_id' => $variante->id,
                'type'        => 'ajustement',
                'quantite'    => abs($ecart),
                'source'      => 'ajustement_manuel',
                'user_id'     => auth()->id(),
                'note'        => $data['note'] . ' (ancien : ' . $ancienStock . ', nouveau : ' . $data['nouveau_stock'] . ')',
                'created_at'  => now(),
            ]);

            DB::commit();

            $request->auditAction  = 'stock_ajuste';
            $request->auditModule  = 'stock';
            $request->auditDetails = [
                'variante_id'  => $variante->id,
                'ancien_stock' => $ancienStock,
                'nouveau_stock'=> $data['nouveau_stock'],
                'ecart'        => $ecart,
                'note'         => $data['note'],
            ];

            return response()->json([
                'variante_id'   => $variante->id,
                'ancien_stock'  => $ancienStock,
                'stock_actuel'  => $variante->fresh()->stock_actuel,
                'ecart'         => $ecart,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    
    public function toggleActif(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $produit = Produit::where('boutique_id', $boutique_id)->findOrFail($id);
        $produit->update(['actif' => !$produit->actif]);

        return response()->json(['actif' => $produit->actif]);
    }

    // Ajouter une variante à un produit existant
    public function storeVariante(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $produit = Produit::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'attributs'   => 'required|array',
            'prix_achat'  => 'nullable|numeric|min:0',
            'prix_vente'  => 'nullable|numeric|min:0',
            'seuil_alerte'=> 'nullable|integer|min:0',
        ]);

        $variante = Variante::create([
            'produit_id'   => $produit->id,
            'boutique_id'  => $boutique_id,
            'attributs'    => $data['attributs'],
            'prix_achat'   => $data['prix_achat'] ?? null,
            'prix_vente'   => $data['prix_vente'] ?? $produit->prix_vente,
            'stock_actuel' => 0,
            'seuil_alerte' => $data['seuil_alerte'] ?? $produit->seuil_alerte,
            'est_defaut'   => false,
        ]);

        // Marquer le produit comme ayant des variantes
        $produit->update(['has_variantes' => true]);

        return response()->json($variante, 201);
    }

    public function destroy(int $boutique_id, int $id): JsonResponse
    {
        $produit = Produit::where('boutique_id', $boutique_id)->findOrFail($id);
        $produit->variantes()->delete();
        $produit->delete();

        return response()->json(['message' => 'Produit supprimé']);
    }

    public function updateVariante(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $variante = Variante::where('boutique_id', $boutique_id)->findOrFail($id);
        $ancienPrix = $variante->prix_vente;

        $data = $request->validate([
            'attributs'   => 'sometimes|array',
            'prix_vente'  => 'sometimes|numeric|min:0',
            'prix_achat'  => 'sometimes|numeric|min:0',
            'seuil_alerte'=> 'sometimes|integer|min:0',
            'actif'       => 'sometimes|boolean',
        ]);

        $variante->update($data);

        if (isset($data['prix_vente']) && $data['prix_vente'] != $ancienPrix) {
            $request->auditAction = 'prix_modifie';
            $request->auditModule = 'produits';
            $request->auditDetails = [
                'variante_id'  => $id,
                'ancien_prix'  => $ancienPrix,
                'nouveau_prix' => $data['prix_vente'],
            ];
        }

        return response()->json($variante->fresh());
    }

    public function destroyVariante(int $boutique_id, int $id): JsonResponse
    {
        $variante = Variante::where('boutique_id', $boutique_id)
                            ->where('est_defaut', false)
                            ->findOrFail($id);
        $variante->delete();

        return response()->json(['message' => 'Variante supprimée']);
    }

    // Entrée de stock
    public function entreeStock(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'variante_id' => 'required|exists:variantes,id',
            'quantite'    => 'required|integer|min:1',
            'note'        => 'nullable|string',
        ]);

        $variante = Variante::where('boutique_id', $boutique_id)->findOrFail($data['variante_id']);

        DB::beginTransaction();
        try {
            $variante->increment('stock_actuel', $data['quantite']);

            MouvementStock::create([
                'boutique_id' => $boutique_id,
                'variante_id' => $variante->id,
                'type'        => 'entree',
                'quantite'    => $data['quantite'],
                'source'      => 'approvisionnement',
                'user_id'     => auth()->id(),
                'note'        => $data['note'] ?? null,
                'created_at'  => now(),
            ]);

            DB::commit();

            $request->auditAction = 'entree_stock';
            $request->auditModule = 'stock';
            $request->auditDetails = [
                'variante_id' => $variante->id,
                'quantite'    => $data['quantite'],
                'source'      => 'approvisionnement',
            ];

            return response()->json([
                'variante_id'  => $variante->id,
                'stock_actuel' => $variante->fresh()->stock_actuel,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    // Mouvements de stock
    public function mouvements(Request $request, int $boutique_id): JsonResponse
    {
        $query = MouvementStock::where('boutique_id', $boutique_id)
                               ->with(['variante.produit', 'user']);

        if ($request->has('variante_id')) {
            $query->where('variante_id', $request->variante_id);
        }

        return response()->json($query->latest('created_at')->paginate(25));
    }

    // Alertes stock bas
    public function alertes(int $boutique_id): JsonResponse
    {
        $alertes = Variante::where('boutique_id', $boutique_id)
                           ->whereRaw('stock_actuel <= seuil_alerte')
                           ->with('produit')
                           ->get();

        return response()->json($alertes);
    }
}