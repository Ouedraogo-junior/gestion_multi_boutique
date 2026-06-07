<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Depense;
use App\Models\Retour;
use App\Models\Variante;
use App\Models\Vente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // -------------------------------------------------------
    // Dashboard boutique (Admin + Vendeur)
    // -------------------------------------------------------
    public function boutique(Request $request, int $boutique_id): JsonResponse
    {
        $user      = auth()->user();
        $aujourdhui = now()->toDateString();
        $debutMois  = now()->startOfMonth()->toDateString();
        $finMois    = now()->endOfMonth()->toDateString();

        // Ventes du jour
        $ventesAujourdhui = Vente::where('boutique_id', $boutique_id)
                                  ->where('statut', 'validee')
                                  ->whereDate('date_validation', $aujourdhui)
                                  ->get();

        // Ventes du mois
        $ventesMois = Vente::where('boutique_id', $boutique_id)
                           ->where('statut', 'validee')
                           ->whereBetween('date_validation', [$debutMois . ' 00:00:00', $finMois . ' 23:59:59'])
                           ->get();

        // Alertes stock
        $alertesStock = Variante::where('boutique_id', $boutique_id)
                                ->whereRaw('stock_actuel <= seuil_alerte')
                                ->with('produit')
                                ->get();

        // Dettes clients
        $dettes = DB::select("
            SELECT COALESCE(SUM(vp.montant), 0) - COALESCE(SUM(pc.montant), 0) AS total_dettes
            FROM ventes v
            LEFT JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
            LEFT JOIN paiements_clients pc ON pc.vente_id = v.id
            WHERE v.boutique_id = ? AND v.statut = 'validee'
        ", [$boutique_id]);

        $totalDettes = $dettes[0]->total_dettes ?? 0;

        // Recouvrement dettes du jour
        $recouvrementAujourdhui = DB::select("
            SELECT COALESCE(SUM(pc.montant), 0) AS total
            FROM paiements_clients pc
            WHERE pc.boutique_id = ? AND DATE(pc.created_at) = ?
        ", [$boutique_id, $aujourdhui]);

        $totalRecouvrement = $recouvrementAujourdhui[0]->total ?? 0;

        // Données communes Admin + Vendeur
        $data = [
            'aujourd_hui' => [
                'ca'            => $ventesAujourdhui->sum('total_net'),
                'nb_ventes'     => $ventesAujourdhui->count(),
                'recouvrement'     => $totalRecouvrement,
            ],
            'mois_en_cours' => [
                'ca'            => $ventesMois->sum('total_net'),
                'nb_ventes'     => $ventesMois->count(),
            ],
            'stock' => [
                'nb_alertes'    => $alertesStock->count(),
                'alertes'       => $alertesStock->map(fn($v) => [
                    'variante_id'  => $v->id,
                    'produit'      => $v->produit?->designation,
                    'stock_actuel' => $v->stock_actuel,
                    'seuil_alerte' => $v->seuil_alerte,
                ]),
            ],
            'dettes_clients' => $totalDettes,
        ];

        // Données supplémentaires Admin uniquement
        if (in_array($user->role, ['admin_boutique', 'super_admin'])) {
            $depensesMois = Depense::where('boutique_id', $boutique_id)
                                   ->whereBetween('date', [$debutMois, $finMois])
                                   ->sum('montant');

            $retoursMois = Retour::where('boutique_id', $boutique_id)
                                 ->whereBetween('created_at', [
                                     $debutMois . ' 00:00:00',
                                     $finMois . ' 23:59:59',
                                 ])
                                 ->sum('montant_rembourse');

            $coutAchatMois = 0;
            foreach ($ventesMois->load('details.variante.produit') as $vente) {
                foreach ($vente->details as $detail) {
                    $coutAchatMois += ($detail->variante?->produit?->prix_achat ?? 0) * $detail->quantite;
                }
            }

            $depensesAujourdhui = Depense::where('boutique_id', $boutique_id)
                              ->whereDate('date', $aujourdhui)
                              ->sum('montant');

            $retoursAujourdhui = Retour::where('boutique_id', $boutique_id)
                                        ->whereDate('created_at', $aujourdhui)
                                        ->sum('montant_rembourse');

            $coutAchatAujourdhui = 0;
            foreach ($ventesAujourdhui->load('details.variante.produit') as $vente) {
                foreach ($vente->details as $detail) {
                    $coutAchatAujourdhui += ($detail->variante?->produit?->prix_achat ?? 0) * $detail->quantite;
                }
            }

            $data['admin'] = [
                'depenses_mois'   => $depensesMois,
                'retours_mois'    => $retoursMois,
                'benefice_mois'   => $ventesMois->sum('total_net') - $retoursMois - $coutAchatMois - $depensesMois,
                'cout_achat_mois' => $coutAchatMois,
                'depenses_aujourdhui'  => $depensesAujourdhui,   
                'retours_aujourdhui'   => $retoursAujourdhui,    
                'benefice_aujourdhui'  => $ventesAujourdhui->sum('total_net') - $retoursAujourdhui - $coutAchatAujourdhui - $depensesAujourdhui,
            ];

            // 5 dernières ventes
            $data['dernieres_ventes'] = Vente::where('boutique_id', $boutique_id)
                                             ->where('statut', 'validee')
                                             ->with(['client', 'vendeur'])
                                             ->latest('date_validation')
                                             ->limit(5)
                                             ->get()
                                             ->map(fn($v) => [
                                                 'id'             => $v->id,
                                                 'numero_facture' => $v->numero_facture,
                                                 'client'         => $v->client?->nom . ' ' . $v->client?->prenom,
                                                 'vendeur'        => $v->vendeur?->prenom . ' ' . $v->vendeur?->nom,
                                                 'total_net'      => $v->total_net,
                                                 'date_validation'=> $v->date_validation,
                                             ]);
        }

        // Vendeur : ses ventes du jour uniquement
        if ($user->role === 'vendeur') {
            $data['mes_ventes_aujourd_hui'] = Vente::where('boutique_id', $boutique_id)
                                                   ->where('vendeur_id', $user->id)
                                                   ->where('statut', 'validee')
                                                   ->whereDate('date_validation', $aujourdhui)
                                                   ->with('details')
                                                   ->get()
                                                   ->map(fn($v) => [
                                                       'id'             => $v->id,
                                                       'numero_facture' => $v->numero_facture,
                                                       'total_net'      => $v->total_net,
                                                       'date_validation'=> $v->date_validation,
                                                   ]);
        }

        return response()->json($data);
    }

    // -------------------------------------------------------
    // Dashboard global (Super Admin)
    // -------------------------------------------------------
    public function global(Request $request): JsonResponse
    {
        $debutMois = now()->startOfMonth()->toDateString();
        $finMois   = now()->endOfMonth()->toDateString();

        $boutiques = Boutique::where('actif', true)->get();

        $caTotalMois      = 0;
        $depensesTotalMois = 0;
        $dettesTotal      = 0;
        $stockTotal       = 0;
        $alertesTotal     = 0;
        $resumeBoutiques  = [];

        foreach ($boutiques as $boutique) {
            $ventesMois = Vente::where('boutique_id', $boutique->id)
                               ->where('statut', 'validee')
                               ->whereBetween('date_validation', [
                                   $debutMois . ' 00:00:00',
                                   $finMois . ' 23:59:59',
                               ])
                               ->sum('total_net');

            $depensesMois = Depense::where('boutique_id', $boutique->id)
                                   ->whereBetween('date', [$debutMois, $finMois])
                                   ->sum('montant');

            $alertes = Variante::where('boutique_id', $boutique->id)
                               ->whereRaw('stock_actuel <= seuil_alerte')
                               ->count();

            $valeurStock = Variante::where('boutique_id', $boutique->id)
                                   ->with('produit')
                                   ->get()
                                   ->sum(fn($v) => $v->stock_actuel * ($v->produit?->prix_achat ?? 0));

            $dettes = DB::select("
                SELECT COALESCE(SUM(vp.montant), 0) - COALESCE(SUM(pc.montant), 0) AS total
                FROM ventes v
                LEFT JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
                LEFT JOIN paiements_clients pc ON pc.vente_id = v.id
                WHERE v.boutique_id = ? AND v.statut = 'validee'
            ", [$boutique->id]);

            $dette = $dettes[0]->total ?? 0;

            $caTotalMois       += $ventesMois;
            $depensesTotalMois += $depensesMois;
            $dettesTotal       += $dette;
            $stockTotal        += $valeurStock;
            $alertesTotal      += $alertes;

            $resumeBoutiques[] = [
                'id'           => $boutique->id,
                'nom'          => $boutique->nom,
                'ca_mois'      => $ventesMois,
                'depenses_mois'=> $depensesMois,
                'dettes'       => $dette,
                'valeur_stock' => $valeurStock,
                'nb_alertes'   => $alertes,
            ];
        }

        // Classement par CA décroissant
        usort($resumeBoutiques, fn($a, $b) => $b['ca_mois'] <=> $a['ca_mois']);

        return response()->json([
            'mois_en_cours' => [
                'ca_total'        => $caTotalMois,
                'depenses_totales'=> $depensesTotalMois,
            ],
            'global' => [
                'dettes_clients'  => $dettesTotal,
                'valeur_stock'    => $stockTotal,
                'nb_alertes'      => $alertesTotal,
                'nb_boutiques'    => $boutiques->count(),
            ],
            'boutiques' => $resumeBoutiques,
        ]);
    }
}