<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referentiel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferentielController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Referentiel::where('boutique_id', $boutique_id);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->orderBy('ordre')->orderBy('libelle')->get());
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:categorie_produit,attribut_variante,categorie_depense,operateur_mm,motif_retour,mode_paiement_fournisseur',
            'libelle' => 'required|string|max:150',
            'ordre'   => 'nullable|integer',
        ]);

        $data['boutique_id'] = $boutique_id;
        $referentiel = Referentiel::create($data);

        return response()->json($referentiel, 201);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $referentiel = Referentiel::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'libelle' => 'sometimes|string|max:150',
            'actif'   => 'sometimes|boolean',
            'ordre'   => 'sometimes|integer',
        ]);

        $referentiel->update($data);

        return response()->json($referentiel->fresh());
    }

    public function destroy(int $boutique_id, int $id): JsonResponse
    {
        $referentiel = Referentiel::where('boutique_id', $boutique_id)->findOrFail($id);
        $referentiel->delete();

        return response()->json(['message' => 'Supprimé']);
    }
}