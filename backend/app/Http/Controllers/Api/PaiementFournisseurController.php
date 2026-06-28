<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approvisionnement;
use App\Models\PaiementFournisseur;
use App\Models\Referentiel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaiementFournisseurController extends Controller
{
    public function index(int $boutique_id, int $appro_id): JsonResponse
    {
        $appro = Approvisionnement::where('boutique_id', $boutique_id)
                                  ->with(['fournisseur', 'paiements.modePaiement', 'paiements.user'])
                                  ->findOrFail($appro_id);

        return response()->json([
            'approvisionnement_id'  => $appro->id,
            'reference'             => $appro->reference,
            'fournisseur'           => $appro->fournisseur,
            'montant_calcule'       => $appro->montant_calcule,
            'montant_total_facture' => $appro->montant_total_facture,
            'montant_du'            => $appro->montant_du,
            'montant_paye'          => $appro->montant_paye,
            'solde_restant'         => $appro->solde_restant,
            'statut_paiement'       => $appro->statut_paiement,
            'versements'            => $appro->paiements,
        ]);
    }

    public function store(Request $request, int $boutique_id, int $appro_id): JsonResponse
    {
        $appro = Approvisionnement::where('boutique_id', $boutique_id)
                                  ->findOrFail($appro_id);

        $data = $request->validate([
            'montant'              => 'required|numeric|min:0.01',
            'mode_paiement_id'     => 'required|exists:referentiels,id',
            'reference_paiement'   => 'nullable|string|max:100',
            'date_paiement'        => 'required|date',
            'note'                 => 'nullable|string',
        ]);

        // Vérifier que le mode appartient bien au type mode_paiement_fournisseur
        $mode = Referentiel::where('id', $data['mode_paiement_id'])
                           ->where('boutique_id', $boutique_id)
                           ->where('type', 'mode_paiement_fournisseur')
                           ->where('actif', true)
                           ->firstOrFail();

        // Vérifier que le montant ne dépasse pas le solde restant
        if ($data['montant'] > $appro->solde_restant) {
            return response()->json([
                'message' => 'Le montant dépasse le solde restant (' . $appro->solde_restant . ' FCFA).',
            ], 422);
        }

        // Référence obligatoire pour virement/chèque — à adapter selon libellés référentiels
        $libelle = strtolower($mode->libelle);
        if (in_array($libelle, ['virement', 'virement bancaire', 'chèque', 'cheque'])
            && empty($data['reference_paiement'])) {
            return response()->json([
                'message' => 'La référence est obligatoire pour ce mode de paiement.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $paiement = PaiementFournisseur::create([
                'boutique_id'          => $boutique_id,
                'approvisionnement_id' => $appro->id,
                'user_id'              => auth()->id(),
                'mode_paiement_id'     => $data['mode_paiement_id'],
                'montant'              => $data['montant'],
                'reference_paiement'   => $data['reference_paiement'] ?? null,
                'date_paiement'        => $data['date_paiement'],
                'note'                 => $data['note'] ?? null,
            ]);

            // Audit
            $soldeApres = $appro->fresh()->solde_restant;
            $estSolde   = $soldeApres <= 0;

            $request->auditAction  = $estSolde ? 'approvisionnement_solde' : 'versement_fournisseur_enregistre';
            $request->auditModule  = 'approvisionnements';
            $request->auditDetails = [
                'approvisionnement_id' => $appro->id,
                'reference'            => $appro->reference,
                'montant'              => $data['montant'],
                'mode'                 => $mode->libelle,
                'reference_paiement'   => $data['reference_paiement'] ?? null,
                'solde_restant_apres'  => $soldeApres,
            ];

            // // Log séparé si soldé
            // if ($soldeApres <= 0) {
            //     request()->auditDetails['action_supplementaire'] = 'approvisionnement_solde';
            // }

            DB::commit();

            $paiement->load(['modePaiement', 'user']);

            return response()->json([
                'paiement'        => $paiement,
                'montant_du'      => $appro->montant_du,
                'montant_paye'    => $appro->fresh()->montant_paye,
                'solde_restant'   => $soldeApres,
                'statut_paiement' => $appro->fresh()->statut_paiement,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
}