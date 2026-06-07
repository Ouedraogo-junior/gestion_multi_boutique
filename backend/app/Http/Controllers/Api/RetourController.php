<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementStock;
use App\Models\Retour;
use App\Models\RetourDetail;
use App\Models\VenteDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RetourController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Retour::where('boutique_id', $boutique_id)
                       ->with(['vente', 'user', 'motif', 'details.variante.produit']);

        if ($request->has('debut') && $request->has('fin')) {
            $query->whereBetween('created_at', [$request->debut, $request->fin . ' 23:59:59']);
        }

        return response()->json($query->latest('created_at')->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'vente_id'             => 'required|exists:ventes,id',
            'motif_id'             => 'nullable|exists:referentiels,id',
            'mode_remboursement'   => 'required|in:especes,avoir,mobile_money',
            'operateur_id'         => 'nullable|exists:referentiels,id',
            'montant_rembourse'    => 'required|numeric|min:0',
            'note'                 => 'nullable|string',
            'lignes'               => 'required|array|min:1',
            'lignes.*.variante_id' => 'required|exists:variantes,id',
            'lignes.*.quantite'    => 'required|integer|min:1',
        ]);

        $vente = \App\Models\Vente::where('boutique_id', $boutique_id)
                                ->where('statut', 'validee')
                                ->with('details')
                                ->findOrFail($data['vente_id']);

        // Calcul du montant max remboursable (plafond)
        $montantMax = 0;
        foreach ($data['lignes'] as $ligne) {
            $venteDetail = $vente->details->where('variante_id', $ligne['variante_id'])->first();
            if ($venteDetail) {
                $montantMax += $venteDetail->prix_applique * $ligne['quantite'];
            }
        }

        if ($data['montant_rembourse'] > $montantMax) {
            return response()->json([
                'message' => 'Le montant remboursé (' . $data['montant_rembourse'] . ') dépasse le montant maximum remboursable (' . $montantMax . ')',
            ], 422);
        }

        DB::beginTransaction();

        try {
            foreach ($data['lignes'] as $ligne) {
                $venteDetail = $vente->details->where('variante_id', $ligne['variante_id'])->first();

                if (!$venteDetail) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'La variante ' . $ligne['variante_id'] . ' ne fait pas partie de cette vente',
                    ], 422);
                }

                if ($ligne['quantite'] > $venteDetail->quantite) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Quantité retournée supérieure à la quantité vendue',
                    ], 422);
                }
            }

            $retour = Retour::create([
                'boutique_id'        => $boutique_id,
                'vente_id'           => $vente->id,
                'user_id'            => auth()->id(),
                'motif_id'           => $data['motif_id'] ?? null,
                'mode_remboursement' => $data['mode_remboursement'],
                'operateur_id'       => $data['operateur_id'] ?? null,
                'montant_rembourse'  => $data['montant_rembourse'],
                'note'               => $data['note'] ?? null,
                'created_at'         => now(),
            ]);

            foreach ($data['lignes'] as $ligne) {
                RetourDetail::create([
                    'retour_id'   => $retour->id,
                    'variante_id' => $ligne['variante_id'],
                    'quantite'    => $ligne['quantite'],
                ]);

                $variante = \App\Models\Variante::find($ligne['variante_id']);
                $variante->increment('stock_actuel', $ligne['quantite']);

                MouvementStock::create([
                    'boutique_id' => $boutique_id,
                    'variante_id' => $ligne['variante_id'],
                    'type'        => 'retour',
                    'quantite'    => $ligne['quantite'],
                    'source'      => 'retour',
                    'source_id'   => $retour->id,
                    'user_id'     => auth()->id(),
                    'note'        => 'Retour vente #' . $vente->numero_facture,
                    'created_at'  => now(),
                ]);
            }

            DB::commit();

            $request->auditAction   = 'retour_enregistre';
            $request->auditModule   = 'retours';
            $request->auditDetails  = [
                'vente_id'          => $vente->id,
                'montant_rembourse' => $data['montant_rembourse'],
            ];

            return response()->json($retour->load(['vente', 'user', 'motif', 'details.variante.produit']), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $retour = Retour::where('boutique_id', $boutique_id)
                        ->with(['vente', 'user', 'motif', 'details.variante.produit'])
                        ->findOrFail($id);

        return response()->json($retour);
    }
}