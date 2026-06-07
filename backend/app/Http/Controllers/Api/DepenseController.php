<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Depense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepenseController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Depense::where('boutique_id', $boutique_id)
                        ->with(['categorie', 'user']);

        if ($request->has('categorie_id')) {
            $query->where('categorie_id', $request->categorie_id);
        }

        if ($request->has('debut') && $request->has('fin')) {
            $query->whereBetween('date', [$request->debut, $request->fin]);
        }

        return response()->json($query->latest('date')->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'categorie_id' => 'nullable|exists:referentiels,id',
            'montant'      => 'required|numeric|min:1',
            'description'  => 'nullable|string',
            'date'         => 'required|date',
        ]);

        $data['boutique_id'] = $boutique_id;
        $data['user_id']     = auth()->id();

        $depense = Depense::create($data);

        $request->auditAction = 'depense_ajoutee';
        $request->auditModule = 'depenses';
        $request->auditDetails = ['apres' => $depense->toArray()];

        return response()->json($depense->load(['categorie', 'user']), 201);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $depense = Depense::where('boutique_id', $boutique_id)->findOrFail($id);
        $avant = $depense->toArray();

        $data = $request->validate([
            'categorie_id' => 'nullable|exists:referentiels,id',
            'montant'      => 'sometimes|numeric|min:1',
            'description'  => 'nullable|string',
            'date'         => 'sometimes|date',
        ]);

        $depense->update($data);

        $request->auditAction = 'depense_modifiee';
        $request->auditModule = 'depenses';
        $request->auditDetails = ['avant' => $avant, 'apres' => $depense->fresh()->toArray()];

        return response()->json($depense->fresh()->load(['categorie', 'user']));
    }

    public function destroy(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $depense = Depense::where('boutique_id', $boutique_id)->findOrFail($id);
        $avant = $depense->toArray();

        $depense->delete();

        $request->auditAction = 'depense_supprimee';
        $request->auditModule = 'depenses';
        $request->auditDetails = ['avant' => $avant];

        return response()->json(['message' => 'Dépense supprimée']);
    }
}