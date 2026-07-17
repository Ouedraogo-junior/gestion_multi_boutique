<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaiementTransfertBoutique;
use App\Models\Referentiel;
use App\Models\TransfertBoutique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementTransfertBoutiqueController extends Controller
{
    public function index(int $boutique_id, int $transfert_id): JsonResponse
    {
        $transfert = TransfertBoutique::where('boutique_source_id', $boutique_id)
                                      ->with(['boutiqueDestination', 'paiements.user', 'paiements.operateur'])
                                      ->findOrFail($transfert_id);

        return response()->json([
            'transfert_id'       => $transfert->id,
            'reference'          => $transfert->reference,
            'boutique_destination' => $transfert->boutiqueDestination,
            'montant_calcule'    => $transfert->montant_calcule,
            'montant_convenu'    => $transfert->montant_convenu,
            'montant_du'         => $transfert->montant_du,
            'montant_paye'       => $transfert->montant_paye,
            'solde_restant'      => $transfert->solde_restant,
            'statut_paiement'    => $transfert->statut_paiement,
            'versements'         => $transfert->paiements,
        ]);
    }

    public function store(Request $request, int $boutique_id, int $transfert_id): JsonResponse
    {
        $transfert = TransfertBoutique::where('boutique_source_id', $boutique_id)
                                    ->findOrFail($transfert_id);

        $data = $request->validate([
            'montant'             => 'required|numeric|min:0.01',
            'mode'                => 'required|in:especes,mobile_money,avance_client',
            'operateur_id'        => 'nullable|exists:referentiels,id',
            'reference_paiement'  => 'nullable|string|max:100',
            'date_paiement'       => 'required|date',
            'note'                => 'nullable|string',
            'client_avance_id'    => 'required_if:mode,avance_client|nullable|exists:clients,id',
        ]);

        if ($data['mode'] === 'mobile_money' && empty($data['operateur_id'])) {
            return response()->json(['message' => 'Un opérateur est requis pour un paiement mobile money'], 422);
        }

        if (!empty($data['operateur_id'])) {
            Referentiel::where('id', $data['operateur_id'])
                    ->where('boutique_id', $boutique_id)
                    ->where('type', 'operateur_mm')
                    ->where('actif', true)
                    ->firstOrFail();
        }

        if ($data['montant'] > $transfert->solde_restant) {
            return response()->json([
                'message' => 'Le montant dépasse le solde restant (' . $transfert->solde_restant . ' FCFA).',
            ], 422);
        }

        // Vérifications spécifiques au paiement par avance
        $clientAvance = null;
        if ($data['mode'] === 'avance_client') {
            $clientAvance = \App\Models\Client::where('boutique_id', $boutique_id)
                                            ->where('id', $data['client_avance_id'])
                                            ->where('est_boutique', true)
                                            ->where('represente_boutique_id', $transfert->boutique_destination_id)
                                            ->first();

            if (!$clientAvance) {
                return response()->json(['message' => 'Aucune avance liée à cette boutique destinataire n\'a été trouvée'], 422);
            }

            if ($data['montant'] > $clientAvance->solde_avance) {
                return response()->json([
                    'message'      => 'Solde d\'avance insuffisant',
                    'solde_avance' => $clientAvance->solde_avance,
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $paiement = PaiementTransfertBoutique::create([
                'boutique_source_id'    => $boutique_id,
                'transfert_boutique_id' => $transfert->id,
                'user_id'               => auth()->id(),
                'montant'               => $data['montant'],
                'mode'                  => $data['mode'],
                'operateur_id'          => $data['operateur_id'] ?? null,
                'reference_paiement'    => $data['reference_paiement'] ?? null,
                'date_paiement'         => $data['date_paiement'],
                'note'                  => $data['note'] ?? null,
            ]);

            // Si paiement par avance, décrémenter le solde d'avance du client-boutique
            if ($data['mode'] === 'avance_client') {
                \App\Models\AvanceClient::create([
                    'boutique_id'           => $boutique_id,
                    'client_id'             => $clientAvance->id,
                    'type'                  => 'utilisation',
                    'montant'               => $data['montant'],
                    'transfert_boutique_id' => $transfert->id,
                    'user_id'               => auth()->id(),
                    'note'                  => 'Utilisée pour régler le transfert ' . $transfert->reference,
                    'created_at'            => $data['date_paiement'] . ' ' . now()->format('H:i:s'),
                ]);
            }

            $soldeApres = $transfert->fresh()->solde_restant;
            $estSolde   = $soldeApres <= 0;

            $request->auditAction  = $estSolde ? 'transfert_boutique_solde' : 'versement_transfert_boutique_enregistre';
            $request->auditModule  = 'transferts_boutiques';
            $request->auditDetails = [
                'transfert_id'        => $transfert->id,
                'reference'           => $transfert->reference,
                'montant'             => $data['montant'],
                'mode'                => $data['mode'],
                'client_avance_id'    => $clientAvance?->id,
                'solde_restant_apres' => $soldeApres,
            ];

            DB::commit();

            $paiement->load(['user', 'operateur']);

            return response()->json([
                'paiement'        => $paiement,
                'montant_du'      => $transfert->montant_du,
                'montant_paye'    => $transfert->fresh()->montant_paye,
                'solde_restant'   => $soldeApres,
                'statut_paiement' => $transfert->fresh()->statut_paiement,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
}