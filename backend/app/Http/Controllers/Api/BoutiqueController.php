<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoutiqueController extends Controller
{
    public function index(): JsonResponse
    {
        $boutiques = Boutique::orderBy('nom')->get();
        return response()->json($boutiques);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'            => 'required|string|max:150',
            'adresse'        => 'nullable|string|max:255',
            'telephone'      => 'nullable|string|max:30',
            'slogan'         => 'nullable|string|max:255',
            'mention_legale' => 'nullable|string',
            'logo' => 'sometimes|nullable|file|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        $boutique = Boutique::create($data);

        $request->auditAction = 'boutique_creee';
        $request->auditModule = 'boutiques';
        $request->auditDetails = ['apres' => $boutique->toArray()];

        return response()->json($boutique, 201);
    }

    public function show(int $id): JsonResponse
    {
        $boutique = Boutique::findOrFail($id);
        return response()->json($boutique);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        // dd($request->allFiles(), $request->file('logo'));

        $boutique = Boutique::findOrFail($id);
        $avant = $boutique->toArray();

        $data = $request->validate([
            'nom'            => 'sometimes|string|max:150',
            'adresse'        => 'nullable|string|max:255',
            'telephone'      => 'nullable|string|max:30',
            'slogan'         => 'nullable|string|max:255',
            'mention_legale' => 'nullable|string',
            'logo' => 'sometimes|nullable|file|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'remove_logo' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('logo')) {
            if ($boutique->logo) {
                \Storage::disk('public')->delete($boutique->logo);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        } elseif ($request->input('remove_logo') === 'true') {
            if ($boutique->logo) {
                \Storage::disk('public')->delete($boutique->logo);
            }
            $data['logo'] = null;
        }

        $boutique->update($data);

        $request->auditAction = 'boutique_modifiee';
        $request->auditModule = 'boutiques';
        $request->auditDetails = ['avant' => $avant, 'apres' => $boutique->fresh()->toArray()];

        return response()->json($boutique->fresh());
    }

    public function toggleActif(Request $request, int $id): JsonResponse
    {
        $boutique = Boutique::findOrFail($id);
        $boutique->update(['actif' => !$boutique->actif]);

        $request->auditAction = $boutique->actif ? 'boutique_activee' : 'boutique_desactivee';
        $request->auditModule = 'boutiques';
        $request->auditDetails = ['boutique_id' => $id, 'actif' => $boutique->actif];

        return response()->json(['actif' => $boutique->actif]);
    }
    
}