<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FournisseurController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Fournisseur::where('boutique_id', $boutique_id)
                            ->where('actif', true);

        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->orderBy('nom')->get());
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'nom'        => 'required|string|max:150',
            'telephone'  => 'nullable|string|max:30',
            'adresse'    => 'nullable|string|max:255',
            'provenance' => 'nullable|string|max:150',
            'notes'      => 'nullable|string',
        ]);

        $fournisseur = Fournisseur::create([...$data, 'boutique_id' => $boutique_id]);

        return response()->json($fournisseur, 201);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $fournisseur = Fournisseur::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'nom'        => 'sometimes|string|max:150',
            'telephone'  => 'nullable|string|max:30',
            'adresse'    => 'nullable|string|max:255',
            'provenance' => 'nullable|string|max:150',
            'notes'      => 'nullable|string',
            'actif'      => 'sometimes|boolean',
        ]);

        $fournisseur->update($data);

        return response()->json($fournisseur->fresh());
    }
}