<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParametreBoutique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParametreController extends Controller
{
    public function index(int $boutique_id): JsonResponse
    {
        $parametres = ParametreBoutique::where('boutique_id', $boutique_id)->get();
        return response()->json($parametres);
    }

    public function upsert(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'parametres'         => 'required|array',
            'parametres.*.cle'   => 'required|string|max:100',
            'parametres.*.valeur'=> 'nullable|string',
            'parametres.*.groupe'=> 'nullable|string|max:100',
        ]);

        $avant = ParametreBoutique::where('boutique_id', $boutique_id)->get()->toArray();

        foreach ($data['parametres'] as $param) {
            ParametreBoutique::updateOrCreate(
                ['boutique_id' => $boutique_id, 'cle' => $param['cle']],
                ['valeur' => $param['valeur'] ?? null, 'groupe' => $param['groupe'] ?? null]
            );
        }

        $apres = ParametreBoutique::where('boutique_id', $boutique_id)->get();

        $request->auditAction = 'parametres_modifies';
        $request->auditModule = 'parametres';
        $request->auditDetails = ['boutique_id' => $boutique_id, 'avant' => $avant, 'apres' => $apres->toArray()];

        return response()->json($apres);
    }
}