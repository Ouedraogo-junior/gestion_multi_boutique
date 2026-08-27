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
use App\Traits\PrixAchatTrait;


class DashboardController extends Controller
{
    use PrixAchatTrait;

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
                        ->with('paiements')
                        ->get();

        // Répartition ventes du jour : réglées intégralement / partielles / entièrement à crédit
        $venteIdsAvecCreditAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $ventesAujourdhui->pluck('id'))
            ->where('mode', 'credit')
            ->distinct()
            ->pluck('vente_id');

        // Parmi les ventes à crédit, lesquelles ont AUSSI une ligne especes/mobile_money (paiement partiel)
        $venteIdsPartiellesAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIdsAvecCreditAujourdhui)
            ->whereIn('mode', ['especes', 'mobile_money', 'avance_client'])
            ->distinct()
            ->pluck('vente_id');

        $venteIdsEntierementCreditAujourdhui = $venteIdsAvecCreditAujourdhui->diff($venteIdsPartiellesAujourdhui)->values();

        // 1. Réglées intégralement
        $nbSansCreditAujourdhui = $ventesAujourdhui->count() - $venteIdsAvecCreditAujourdhui->count();
        $montantSansCreditAujourdhui = $ventesAujourdhui
            ->whereNotIn('id', $venteIdsAvecCreditAujourdhui)
            ->sum('total_net');

        // 2. Règlements partiels
        $nbPartiellesAujourdhui = $venteIdsPartiellesAujourdhui->count();
        $creditPartiellesAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIdsPartiellesAujourdhui)
            ->where('mode', 'credit')
            ->sum('montant');
        $regleImmediatPartiellesAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIdsPartiellesAujourdhui)
            ->whereIn('mode', ['especes', 'mobile_money', 'avance_client'])
            ->sum('montant');

        // 3. Entièrement à crédit
        $nbEntierementCreditAujourdhui = $venteIdsEntierementCreditAujourdhui->count();
        $montantEntierementCreditAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIdsEntierementCreditAujourdhui)
            ->where('mode', 'credit')
            ->sum('montant');

        // 4. Total fusionné (résumé des deux catégories ci-dessus)
        $nbAvecCreditAujourdhui = $venteIdsAvecCreditAujourdhui->count();
        $creditAccordeAujourdhui = (float) $creditPartiellesAujourdhui + (float) $montantEntierementCreditAujourdhui;

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

        // Dettes clients (ventes à crédit)
        $dettes = DB::select("
            SELECT
                COALESCE((
                    SELECT SUM(vp.montant)
                    FROM ventes v
                    JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
                    WHERE v.boutique_id = ? AND v.statut = 'validee'
                ), 0)
                -
                COALESCE((
                    SELECT SUM(pc.montant)
                    FROM paiements_clients pc
                    JOIN ventes v ON v.id = pc.vente_id AND v.statut = 'validee'
                    WHERE v.boutique_id = ?
                ), 0) AS total_dettes
        ", [$boutique_id, $boutique_id]);

        // Dettes antérieures
        $dettesInitiales = DB::select("
            SELECT
                COALESCE((SELECT SUM(montant) FROM dettes_initiales WHERE boutique_id = ?), 0)
                -
                COALESCE((SELECT SUM(montant) FROM dette_initiale_paiements WHERE boutique_id = ?), 0) AS total
        ", [$boutique_id, $boutique_id]);

        $totalDettes = (float) ($dettes[0]->total_dettes ?? 0) + (float) ($dettesInitiales[0]->total ?? 0);

        // Recouvrement dettes du jour (ventes à crédit)
        $recouvrementAujourdhui = DB::select("
            SELECT COALESCE(SUM(pc.montant), 0) AS total
            FROM paiements_clients pc
            WHERE pc.boutique_id = ? AND DATE(pc.date) = ? AND pc.mode != 'ajustement_retour'
        ", [$boutique_id, $aujourdhui]);

        // Recouvrement dettes antérieures du jour
        $recouvrementInitialesAujourdhui = DB::select("
            SELECT COALESCE(SUM(montant), 0) AS total
            FROM dette_initiale_paiements
            WHERE boutique_id = ? AND DATE(date) = ?
        ", [$boutique_id, $aujourdhui]);

        $totalRecouvrement = (float) ($recouvrementAujourdhui[0]->total ?? 0)
            + (float) ($recouvrementInitialesAujourdhui[0]->total ?? 0);

        // Argent réellement rentré en caisse aujourd'hui : paiement immédiat des ventes du jour + recouvrement de dettes
        $regleImmediatAujourdhui = DB::table('vente_paiements')
            ->whereIn('vente_id', $ventesAujourdhui->pluck('id'))
            ->whereIn('mode', ['especes', 'mobile_money'])
            ->sum('montant');

        // Dépôts d'avance du jour — argent réel reçu (espèces/mobile money), pas encore lié à une vente
        // Exclut les clients marqués "est_boutique" (autre boutique du réseau, pas un vrai client)
        $avancesDeposeesAujourdhui = DB::table('avances_clients as ac')
            ->join('clients as c', 'c.id', '=', 'ac.client_id')
            ->where('ac.boutique_id', $boutique_id)
            ->where('ac.type', 'depot')
            ->where('c.est_boutique', false)
            ->whereDate('ac.created_at', $aujourdhui)
            ->sum('ac.montant');

        $totalEncaisseAujourdhui = (float) $regleImmediatAujourdhui
            + $totalRecouvrement
            + (float) $avancesDeposeesAujourdhui;

        // Données communes Admin + Vendeur
        $data = [
            'aujourd_hui' => [
                'ca'            => $ventesAujourdhui->sum('total_net'),
                'nb_ventes'     => $ventesAujourdhui->count(),
                'recouvrement'  => $totalRecouvrement,
                'encaisse_reel' => (float) $totalEncaisseAujourdhui,
                'regle_sur_ventes'=> (float) $regleImmediatAujourdhui,
                'avances_deposees'      => (float) $avancesDeposeesAujourdhui,
                'sans_credit'   => [
                    'count'   => $nbSansCreditAujourdhui,
                    'montant' => (float) $montantSansCreditAujourdhui,
                ],
                'partielles' => [
                    'count'          => $nbPartiellesAujourdhui,
                    'montant_regle'  => (float) $regleImmediatPartiellesAujourdhui,
                    'montant_credit' => (float) $creditPartiellesAujourdhui,
                ],
                'entierement_credit' => [
                    'count'   => $nbEntierementCreditAujourdhui,
                    'montant' => (float) $montantEntierementCreditAujourdhui,
                ],
                'avec_credit' => [
                    'count'          => $nbAvecCreditAujourdhui,
                    'credit_accorde' => (float) $creditAccordeAujourdhui,
                ],
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
                    $coutAchatMois += $this->getPrixAchatVariante($detail->variante) * $detail->quantite;
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
                    $coutAchatAujourdhui += $this->getPrixAchatVariante($detail->variante) * $detail->quantite;
                }
            }

            // Créances sur transferts inter-boutiques (marchandise cédée, pas encore payée par la boutique destinataire)
            $transfertsEnCours = \App\Models\TransfertBoutique::where('boutique_source_id', $boutique_id)
                ->where('statut', 'valide')
                ->withSum('paiements', 'montant')
                ->get()
                ->map(function ($t) {
                    $du   = (float) ($t->montant_convenu ?? $t->montant_calcule);
                    $paye = (float) ($t->paiements_sum_montant ?? 0);
                    return max(0, $du - $paye);
                })
                ->sum();

            // Encaissé aujourd'hui sur transferts inter-boutiques — KPI à part
            $encaisseTransfertsBoutiquesAujourdhui = DB::table('paiements_transferts_boutiques')
                ->where('boutique_source_id', $boutique_id)
                ->whereDate('created_at', $aujourdhui)
                ->sum('montant');

            
            // KPI 1 — Montant réglé aujourd'hui via avance sur des transferts
            $regleAvanceTransfertsAujourdhui = DB::table('avances_clients')
                ->where('boutique_id', $boutique_id)
                ->where('type', 'utilisation')
                ->whereNotNull('transfert_boutique_id')
                ->whereDate('created_at', $aujourdhui)
                ->sum('montant');

            // KPI 2 — Solde total des avances des boutiques-clientes (tous soldes confondus, pas juste aujourd'hui)
            $soldeAvancesBoutiques = \App\Models\Client::where('boutique_id', $boutique_id)
                ->where('est_boutique', true)
                ->get()
                ->sum(fn($c) => $c->solde_avance);

            $data['admin'] = [
                'depenses_mois'   => $depensesMois,
                'retours_mois'    => $retoursMois,
                'benefice_mois'   => $ventesMois->sum('total_net') - $retoursMois - $coutAchatMois - $depensesMois,
                'cout_achat_mois' => $coutAchatMois,
                'depenses_aujourdhui'  => $depensesAujourdhui,   
                'retours_aujourdhui'   => $retoursAujourdhui,    
                'benefice_aujourdhui'  => $ventesAujourdhui->sum('total_net') - $retoursAujourdhui - $coutAchatAujourdhui - $depensesAujourdhui,
                'creances_transferts_boutiques'            => (float) $transfertsEnCours,
                'encaisse_transferts_boutiques_aujourdhui' => (float) $encaisseTransfertsBoutiquesAujourdhui,
                'regle_avance_transferts_aujourdhui'       => (float) $regleAvanceTransfertsAujourdhui,
                'solde_avances_boutiques'                  => (float) $soldeAvancesBoutiques,
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

        $boutiques   = Boutique::where('actif', true)->get();
        $boutiqueIds = $boutiques->pluck('id');

        // CA mois par boutique — 1 requête au lieu de N
        $ventesParBoutique = Vente::where('statut', 'validee')
            ->whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('date_validation', [$debutMois . ' 00:00:00', $finMois . ' 23:59:59'])
            ->select('boutique_id', DB::raw('SUM(total_net) as total'))
            ->groupBy('boutique_id')
            ->pluck('total', 'boutique_id');

        // Dépenses mois par boutique
        $depensesParBoutique = Depense::whereIn('boutique_id', $boutiqueIds)
            ->whereBetween('date', [$debutMois, $finMois])
            ->select('boutique_id', DB::raw('SUM(montant) as total'))
            ->groupBy('boutique_id')
            ->pluck('total', 'boutique_id');

        // Alertes stock par boutique
        $alertesParBoutique = Variante::whereIn('boutique_id', $boutiqueIds)
            ->whereRaw('stock_actuel <= seuil_alerte')
            ->select('boutique_id', DB::raw('COUNT(*) as total'))
            ->groupBy('boutique_id')
            ->pluck('total', 'boutique_id');

        // Valeur de stock : toutes les variantes + produits chargés en une seule fois
        $variantesParBoutique = Variante::whereIn('boutique_id', $boutiqueIds)
            ->with('produit')
            ->get()
            ->groupBy('boutique_id');

        // Total crédit par boutique (ventes à crédit validées)
        $totalCreditParBoutique = DB::table('ventes as v')
            ->join('vente_paiements as vp', 'vp.vente_id', '=', 'v.id')
            ->where('v.statut', 'validee')
            ->where('vp.mode', 'credit')
            ->whereIn('v.boutique_id', $boutiqueIds)
            ->select('v.boutique_id', DB::raw('SUM(vp.montant) as total'))
            ->groupBy('v.boutique_id')
            ->pluck('total', 'boutique_id');

        // Total payé par boutique (paiements clients sur ventes validées)
        $totalPayeParBoutique = DB::table('paiements_clients as pc')
            ->join('ventes as v', 'v.id', '=', 'pc.vente_id')
            ->where('v.statut', 'validee')
            ->whereIn('v.boutique_id', $boutiqueIds)
            ->select('v.boutique_id', DB::raw('SUM(pc.montant) as total'))
            ->groupBy('v.boutique_id')
            ->pluck('total', 'boutique_id');

        // Total dettes antérieures par boutique
        $totalDetteInitialeParBoutique = DB::table('dettes_initiales')
            ->whereIn('boutique_id', $boutiqueIds)
            ->select('boutique_id', DB::raw('SUM(montant) as total'))
            ->groupBy('boutique_id')
            ->pluck('total', 'boutique_id');

        $totalPayeDetteInitialeParBoutique = DB::table('dette_initiale_paiements')
            ->whereIn('boutique_id', $boutiqueIds)
            ->select('boutique_id', DB::raw('SUM(montant) as total'))
            ->groupBy('boutique_id')
            ->pluck('total', 'boutique_id');

        $caTotalMois       = 0;
        $depensesTotalMois = 0;
        $dettesTotal       = 0;
        $stockTotal        = 0;
        $alertesTotal      = 0;
        $resumeBoutiques   = [];

        foreach ($boutiques as $boutique) {
            $ventesMois   = (float) ($ventesParBoutique[$boutique->id] ?? 0);
            $depensesMois = (float) ($depensesParBoutique[$boutique->id] ?? 0);
            $alertes      = (int) ($alertesParBoutique[$boutique->id] ?? 0);

            $valeurStock = 0;
            foreach ($variantesParBoutique->get($boutique->id, collect()) as $v) {
                $valeurStock += $v->stock_actuel * $this->getPrixAchatVariante($v);
            }

            $detteInitiale = (float) ($totalDetteInitialeParBoutique[$boutique->id] ?? 0)
                - (float) ($totalPayeDetteInitialeParBoutique[$boutique->id] ?? 0);

            $dette = (float) ($totalCreditParBoutique[$boutique->id] ?? 0)
                - (float) ($totalPayeParBoutique[$boutique->id] ?? 0)
                + $detteInitiale;

            $caTotalMois       += $ventesMois;
            $depensesTotalMois += $depensesMois;
            $dettesTotal       += $dette;
            $stockTotal        += $valeurStock;
            $alertesTotal      += $alertes;

            $resumeBoutiques[] = [
                'id'            => $boutique->id,
                'nom'           => $boutique->nom,
                'ca_mois'       => $ventesMois,
                'depenses_mois' => $depensesMois,
                'dettes'        => $dette,
                'valeur_stock'  => $valeurStock,
                'nb_alertes'    => $alertes,
            ];
        }

        usort($resumeBoutiques, fn($a, $b) => $b['ca_mois'] <=> $a['ca_mois']);

        return response()->json([
            'mois_en_cours' => [
                'ca_total'         => $caTotalMois,
                'depenses_totales' => $depensesTotalMois,
            ],
            'global' => [
                'dettes_clients' => $dettesTotal,
                'valeur_stock'   => $stockTotal,
                'nb_alertes'     => $alertesTotal,
                'nb_boutiques'   => $boutiques->count(),
            ],
            'boutiques' => $resumeBoutiques,
        ]);
    }
}