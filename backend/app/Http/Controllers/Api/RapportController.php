<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Boutique;
use App\Models\Depense;
use App\Models\Retour;
use App\Models\Variante;
use App\Models\Vente;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Exports\RapportExport;
use Maatwebsite\Excel\Facades\Excel;

class RapportController extends Controller
{

    private function getPrixAchatVariante(Variante $variante): float
    {
        // Si la variante a son propre prix_achat → on l'utilise
        // Sinon → fallback sur le prix_achat du produit (produit sans variantes)
        return $variante->prix_achat ?? $variante->produit?->prix_achat ?? 0;
    }


    // -------------------------------------------------------
    // Rapport CA par boutique
    // -------------------------------------------------------
    public function ca(Request $request, int $boutique_id): JsonResponse
    {
        $request->validate([
            'debut' => 'required|date',
            'fin'   => 'required|date|after_or_equal:debut',
        ]);

        $debut = $request->debut;
        $fin   = $request->fin . ' 23:59:59';

        $boutique = Boutique::findOrFail($boutique_id);

        // Ventes validées sur la période
        $ventes = Vente::where('boutique_id', $boutique_id)
                    ->where('statut', 'validee')
                    ->whereBetween('date_validation', [$debut, $fin])
                    ->with(['details.variante.produit', 'paiements', 'client:id,nom,prenom'])
                    ->get();

        $totalBrut   = $ventes->sum('total_brut');
        $totalRemise = $ventes->sum('total_remise');
        $totalNet    = $ventes->sum('total_net');

        // Retours sur la période
        $retours = Retour::where('boutique_id', $boutique_id)
                        ->whereBetween('created_at', [$debut, $fin])
                        ->get();
        $totalRetours = $retours->sum('montant_rembourse');

        // Paiements par mode
        $parMode = ['especes' => 0, 'mobile_money' => 0, 'credit' => 0, 'avance_client' => 0];
        foreach ($ventes as $vente) {
            foreach ($vente->paiements as $p) {
                $parMode[$p->mode] = ($parMode[$p->mode] ?? 0) + $p->montant;
            }
        }

        // Coûts & marges
        $coutAchat = 0;
        foreach ($ventes as $vente) {
            foreach ($vente->details as $detail) {
                $variante  = $detail->variante ?? Variante::with('produit')->find($detail->variante_id);
                $prixAchat = $this->getPrixAchatVariante($variante);
                $coutAchat += $prixAchat * $detail->quantite;
            }
        }

        $depenses     = Depense::where('boutique_id', $boutique_id)
                            ->whereBetween('date', [$request->debut, $request->fin])
                            ->sum('montant');

        $margeBrute   = $totalNet - $totalRetours - $coutAchat;
        $beneficeNet  = $margeBrute - $depenses;

        // Écart prix (prix catalogue vs prix appliqué)
        $ecartPrix = 0;
        foreach ($ventes as $vente) {
            foreach ($vente->details as $detail) {
                $ecartPrix += ($detail->prix_catalogue - $detail->prix_applique) * $detail->quantite;
            }
        }

        // ── Répartition Réglées / Partielles / Entièrement à crédit ──────────────
        // Un règlement immédiat inclut especes, mobile_money ET avance_client —
        // l'avance est déjà en caisse au moment du dépôt, elle compte donc comme
        // "réglé" du point de vue de cette classification (contrairement au crédit,
        // qui reste une vraie dette en attente).
        $venteIdsAvecCredit = $ventes->filter(fn($v) => $v->paiements->contains('mode', 'credit'))->pluck('id');
        $venteIdsPartielles = $ventes->filter(function ($v) use ($venteIdsAvecCredit) {
            return $venteIdsAvecCredit->contains($v->id)
                && $v->paiements->contains(fn($p) => in_array($p->mode, ['especes', 'mobile_money', 'avance_client']));
        })->pluck('id');
        $venteIdsEntierementCredit = $venteIdsAvecCredit->diff($venteIdsPartielles)->values();

        $nbSansCredit      = $ventes->count() - $venteIdsAvecCredit->count();
        $montantSansCredit = $ventes->whereNotIn('id', $venteIdsAvecCredit)->sum('total_net');

        $nbPartielles            = $venteIdsPartielles->count();
        $creditPartielles        = $ventes->whereIn('id', $venteIdsPartielles)
            ->flatMap(fn($v) => $v->paiements)->where('mode', 'credit')->sum('montant');
        $regleImmediatPartielles = $ventes->whereIn('id', $venteIdsPartielles)
            ->flatMap(fn($v) => $v->paiements)->whereIn('mode', ['especes', 'mobile_money', 'avance_client'])->sum('montant');

        $nbEntierementCredit      = $venteIdsEntierementCredit->count();
        $montantEntierementCredit = $ventes->whereIn('id', $venteIdsEntierementCredit)
            ->flatMap(fn($v) => $v->paiements)->where('mode', 'credit')->sum('montant');

        // ── Argent réellement encaissé sur la période ─────────────────────────────
        // Volontairement limité à especes/mobile_money : une avance utilisée ici n'est
        // pas un nouvel encaissement, l'argent est déjà entré en caisse au dépôt.
        $regleSurVentesPeriode = (float) ($parMode['especes'] ?? 0) + (float) ($parMode['mobile_money'] ?? 0);

        $recouvrementVentePeriode = DB::table('paiements_clients')
            ->where('boutique_id', $boutique_id)
            ->where('mode', '!=', 'ajustement_retour')
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant');

        $recouvrementDetteInitialePeriode = DB::table('dette_initiale_paiements')
            ->where('boutique_id', $boutique_id)
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant');

        $recouvrementPeriode = (float) $recouvrementVentePeriode + (float) $recouvrementDetteInitialePeriode;

        $avancesDeposeesPeriode = DB::table('avances_clients as ac')
            ->join('clients as c', 'c.id', '=', 'ac.client_id')
            ->where('ac.boutique_id', $boutique_id)
            ->where('ac.type', 'depot')
            ->where('c.est_boutique', false)
            ->whereBetween('ac.created_at', [$debut, $fin])
            ->sum('ac.montant');

        $encaisseReelPeriode = $regleSurVentesPeriode + $recouvrementPeriode + (float) $avancesDeposeesPeriode;

        // ── Transferts inter-boutiques ────────────────────────────────────────────
        $creancesTransfertsActuelles = \App\Models\TransfertBoutique::where('boutique_source_id', $boutique_id)
            ->where('statut', 'valide')
            ->withSum('paiements', 'montant')
            ->get()
            ->sum(function ($t) {
                $du   = (float) ($t->montant_convenu ?? $t->montant_calcule);
                $paye = (float) ($t->paiements_sum_montant ?? 0);
                return max(0, $du - $paye);
            });

        $transfertsCreesPeriode = \App\Models\TransfertBoutique::where('boutique_source_id', $boutique_id)
            ->whereBetween('created_at', [$debut, $fin])
            ->get()
            ->sum(fn($t) => (float) ($t->montant_convenu ?? $t->montant_calcule));

        $encaisseTransfertsPeriode = DB::table('paiements_transferts_boutiques')
            ->where('boutique_source_id', $boutique_id)
            ->whereIn('mode', ['especes', 'mobile_money'])
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant');

        $regleAvanceTransfertsPeriode = DB::table('paiements_transferts_boutiques')
            ->where('boutique_source_id', $boutique_id)
            ->where('mode', 'avance_client')
            ->whereBetween('created_at', [$debut, $fin])
            ->sum('montant');

        // ── Détail des ventes de la période ───────────────────────────────────────
        $venteIds = $ventes->pluck('id');
        $rembourseParVente = DB::table('paiements_clients')
            ->whereIn('vente_id', $venteIds)
            ->groupBy('vente_id')
            ->selectRaw('vente_id, SUM(montant) as total')
            ->pluck('total', 'vente_id');

        $detailVentes = $ventes->map(function ($v) use ($rembourseParVente) {
            $credit    = (float) $v->paiements->where('mode', 'credit')->sum('montant');
            $cash      = (float) $v->paiements->whereIn('mode', ['especes', 'mobile_money', 'avance_client'])->sum('montant');
            $rembourse = (float) ($rembourseParVente[$v->id] ?? 0);
            $resteDu   = max(0, $credit - $rembourse);
            $categorie = $credit == 0 ? 'reglee' : ($cash > 0 ? 'partielle' : 'credit_total');

            return [
                'id'              => $v->id,
                'numero_facture'  => $v->numero_facture,
                'client_nom'      => $v->client ? trim(($v->client->prenom ?? '') . ' ' . $v->client->nom) : null,
                'date_validation' => $v->date_validation,
                'total_net'       => (float) $v->total_net,
                'categorie'       => $categorie,
                'credit_accorde'  => $credit,
                'cash'            => $cash,
                'rembourse'       => $rembourse,
                'reste_du'        => $resteDu,
            ];
        })->sortByDesc('date_validation')->values();

        // Détail des écarts de prix — uniquement les lignes où le prix appliqué diffère du catalogue
        $articlesVendus = collect();
        foreach ($ventes as $vente) {
            foreach ($vente->details as $detail) {
                $prixAchat     = $this->getPrixAchatVariante($detail->variante);
                $prixCatalogue = (float) $detail->prix_catalogue;
                $prixApplique  = (float) $detail->prix_applique;
                $quantite      = $detail->quantite;
                $montantLigne  = ($prixApplique * $quantite) - (float) $detail->remise_montant;

                $articlesVendus->push([
                    'numero_facture'  => $vente->numero_facture,
                    'date_validation' => $vente->date_validation,
                    'produit'         => $detail->variante->produit->designation ?? '—',
                    'quantite'        => $quantite,
                    'prix_achat'      => $prixAchat,
                    'prix_vente'      => $prixCatalogue,
                    'prix_applique'   => $prixApplique,
                    'montant'         => $montantLigne,
                ]);
            }
        }
        $articlesVendus = $articlesVendus->sortBy('date_validation')->values();

        return response()->json([
            'periode'  => ['debut' => $request->debut, 'fin' => $request->fin],
            'boutique' => ['id' => $boutique->id, 'nom' => $boutique->nom],
            'ca' => [
                'brut'          => $totalBrut,
                'retours'       => $totalRetours,
                'net'           => $totalNet - $totalRetours,
                'total_remises' => $totalRemise,
                'ecart_prix'    => $ecartPrix,
            ],
            'couts' => [
                'achat'        => $coutAchat,
                'marge_brute'  => $margeBrute,
                'depenses'     => $depenses,
                'benefice_net' => $beneficeNet,
            ],
            'ventes' => [
                'count_validees'     => $ventes->count(),
                'count_brouillons'   => Vente::where('boutique_id', $boutique_id)
                                            ->where('statut', 'brouillon')
                                            ->count(),
                'par_mode'           => $parMode,
                'sans_credit'        => [
                    'count'   => $nbSansCredit,
                    'montant' => (float) $montantSansCredit,
                ],
                'partielles'         => [
                    'count'          => $nbPartielles,
                    'montant_regle'  => (float) $regleImmediatPartielles,
                    'montant_credit' => (float) $creditPartielles,
                ],
                'entierement_credit' => [
                    'count'   => $nbEntierementCredit,
                    'montant' => (float) $montantEntierementCredit,
                ],
                'detail'             => $detailVentes,
                'articles_vendus'    => $articlesVendus,
            ],
            'encaisse' => [
                'regle_sur_ventes' => $regleSurVentesPeriode,
                'recouvrement'     => $recouvrementPeriode,
                'avances_deposees' => (float) $avancesDeposeesPeriode,
                'total'            => $encaisseReelPeriode,
            ],
            'transferts_boutiques' => [
                'creances_actuelles'   => (float) $creancesTransfertsActuelles,
                'crees_periode'        => (float) $transfertsCreesPeriode,
                'encaisse_periode'     => (float) $encaisseTransfertsPeriode,
                'regle_avance_periode' => (float) $regleAvanceTransfertsPeriode,
            ],
        ]);
    }

    // -------------------------------------------------------
    // Rapport stock
    // -------------------------------------------------------
    public function stock(Request $request, int $boutique_id): JsonResponse
    {
        $variantes = Variante::where('boutique_id', $boutique_id)
                             ->with('produit')
                             ->get();

        $valeurStock = $variantes->sum(fn($v) => $v->stock_actuel * $this->getPrixAchatVariante($v));
        $enAlerte    = $variantes->filter(fn($v) => $v->stock_actuel <= $v->seuil_alerte);

        return response()->json([
            'boutique_id'   => $boutique_id,
            'valeur_stock'  => $valeurStock,
            'total_articles'=> $variantes->sum('stock_actuel'),
            'en_alerte'     => $enAlerte->count(),
            'variantes'     => $variantes->map(fn($v) => [
                'variante_id'   => $v->id,
                'produit'       => $v->produit?->designation,
                'reference'     => $v->produit?->reference,
                'attributs'     => $v->attributs,
                'stock_actuel'  => $v->stock_actuel,
                'seuil_alerte'  => $v->seuil_alerte,
                'en_alerte'     => $v->stock_actuel <= $v->seuil_alerte,
                'valeur'        => $v->stock_actuel * $this->getPrixAchatVariante($v),
            ]),
        ]);
    }

    // -------------------------------------------------------
    // Rapport dettes clients
    // -------------------------------------------------------
   public function dettes(Request $request, int $boutique_id): JsonResponse
    {
        $request->validate([
            'debut' => 'required|date',
            'fin'   => 'required|date|after_or_equal:debut',
        ]);

        $dettes = DB::select("
            SELECT
                c.id AS client_id,
                c.nom,
                c.prenom,
                c.telephone,
                COALESCE(vente_credit.total, 0) + COALESCE(di.total, 0) AS total_credit,
                COALESCE(vente_paye.total, 0) + COALESCE(dip.total, 0) AS total_paye,
                (COALESCE(vente_credit.total, 0) + COALESCE(di.total, 0))
                - (COALESCE(vente_paye.total, 0) + COALESCE(dip.total, 0)) AS solde_dette
            FROM clients c
            LEFT JOIN (
                SELECT v.client_id, SUM(vp.montant) AS total
                FROM ventes v
                JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
                WHERE v.statut = 'validee' AND v.boutique_id = ?
                GROUP BY v.client_id
            ) vente_credit ON vente_credit.client_id = c.id
            LEFT JOIN (
                SELECT v.client_id, SUM(pc.montant) AS total
                FROM paiements_clients pc
                JOIN ventes v ON v.id = pc.vente_id AND v.statut = 'validee'
                WHERE v.boutique_id = ?
                GROUP BY v.client_id
            ) vente_paye ON vente_paye.client_id = c.id
            LEFT JOIN (
                SELECT client_id, SUM(montant) AS total
                FROM dettes_initiales
                WHERE boutique_id = ?
                GROUP BY client_id
            ) di ON di.client_id = c.id
            LEFT JOIN (
                SELECT client_id, SUM(montant) AS total
                FROM dette_initiale_paiements
                WHERE boutique_id = ?
                GROUP BY client_id
            ) dip ON dip.client_id = c.id
            WHERE c.boutique_id = ?
            HAVING solde_dette > 0
            ORDER BY solde_dette DESC
        ", [$boutique_id, $boutique_id, $boutique_id, $boutique_id, $boutique_id]);

        // Historique des paiements reçus sur la période choisie — flux, pas un solde
        $debut = $request->debut . ' 00:00:00';
        $fin   = $request->fin   . ' 23:59:59';

        $paiementsPeriode = DB::select("
            SELECT * FROM (
                SELECT
                    pc.id, pc.client_id, c.nom, c.prenom, pc.montant, pc.mode, pc.created_at AS date,
                    'vente' AS source, v.numero_facture
                FROM paiements_clients pc
                JOIN clients c ON c.id = pc.client_id
                JOIN ventes v ON v.id = pc.vente_id
                WHERE pc.boutique_id = ?

                UNION ALL

                SELECT
                    dip.id, dip.client_id, c.nom, c.prenom, dip.montant, dip.mode, dip.created_at AS date,
                    'dette_initiale' AS source, NULL AS numero_facture
                FROM dette_initiale_paiements dip
                JOIN clients c ON c.id = dip.client_id
                WHERE dip.boutique_id = ?
            ) sub
            WHERE date BETWEEN ? AND ?
            ORDER BY date DESC
        ", [$boutique_id, $boutique_id, $debut, $fin]);

        return response()->json([
            'boutique_id'             => $boutique_id,
            'total_dettes'            => collect($dettes)->sum('solde_dette'),
            'clients'                 => $dettes,
            'periode'                 => ['debut' => $request->debut, 'fin' => $request->fin],
            'total_paiements_periode' => collect($paiementsPeriode)->sum('montant'),
            'paiements_periode'       => $paiementsPeriode,
        ]);
    }

    // -------------------------------------------------------
    // Rapport dépenses
    // -------------------------------------------------------
    public function depenses(Request $request, int $boutique_id): JsonResponse
    {
        $request->validate([
            'debut' => 'required|date',
            'fin'   => 'required|date|after_or_equal:debut',
        ]);

        $depenses = Depense::where('boutique_id', $boutique_id)
                           ->whereBetween('date', [$request->debut, $request->fin])
                           ->with('categorie')
                           ->get();

        $parCategorie = $depenses->groupBy(fn($d) => $d->categorie?->libelle ?? 'Non catégorisé')
                                 ->map(fn($g) => $g->sum('montant'));

        return response()->json([
            'periode'       => ['debut' => $request->debut, 'fin' => $request->fin],
            'boutique_id'   => $boutique_id,
            'total'         => $depenses->sum('montant'),
            'par_categorie' => $parCategorie,
            'depenses'      => $depenses,
        ]);
    }

    // -------------------------------------------------------
    // Rapport consolidé (Super Admin)
    // -------------------------------------------------------
    public function consolide(Request $request): JsonResponse
    {
        $request->validate([
            'debut' => 'required|date',
            'fin'   => 'required|date|after_or_equal:debut',
        ]);

        $debut = $request->debut;
        $fin   = $request->fin . ' 23:59:59';

        $boutiques = Boutique::where('actif', true)->get();
        $result    = [];
        $caTotal   = 0;
        $beneficeTotal = 0;
        $depensesTotal = 0;
        $dettesTotal   = 0;
        $stockTotal    = 0;


        $boutiqueIds = $boutiques->pluck('id');

        $totalCreditParBoutique = DB::table('ventes as v')
            ->join('vente_paiements as vp', 'vp.vente_id', '=', 'v.id')
            ->where('v.statut', 'validee')->where('vp.mode', 'credit')
            ->whereIn('v.boutique_id', $boutiqueIds)
            ->select('v.boutique_id', DB::raw('SUM(vp.montant) as total'))
            ->groupBy('v.boutique_id')->pluck('total', 'boutique_id');

        $totalPayeParBoutique = DB::table('paiements_clients as pc')
            ->join('ventes as v', 'v.id', '=', 'pc.vente_id')
            ->where('v.statut', 'validee')
            ->whereIn('v.boutique_id', $boutiqueIds)
            ->select('v.boutique_id', DB::raw('SUM(pc.montant) as total'))
            ->groupBy('v.boutique_id')->pluck('total', 'boutique_id');

        $totalDetteInitialeParBoutique = DB::table('dettes_initiales')
            ->whereIn('boutique_id', $boutiqueIds)
            ->select('boutique_id', DB::raw('SUM(montant) as total'))
            ->groupBy('boutique_id')->pluck('total', 'boutique_id');

        $totalPayeDetteInitialeParBoutique = DB::table('dette_initiale_paiements')
            ->whereIn('boutique_id', $boutiqueIds)
            ->select('boutique_id', DB::raw('SUM(montant) as total'))
            ->groupBy('boutique_id')->pluck('total', 'boutique_id');

        foreach ($boutiques as $boutique) {
            $ventes = Vente::where('boutique_id', $boutique->id)
                           ->where('statut', 'validee')
                           ->whereBetween('date_validation', [$debut, $fin])
                           ->with(['details.variante.produit', 'paiements'])
                           ->get();

            $ca       = $ventes->sum('total_net');
            $depenses = Depense::where('boutique_id', $boutique->id)
                               ->whereBetween('date', [$debut, $request->fin])
                               ->sum('montant');

            $coutAchat = 0;
            foreach ($ventes as $vente) {
                foreach ($vente->details as $detail) {
                    $coutAchat += $this->getPrixAchatVariante($detail->variante) * $detail->quantite;
                }
            }

            $retours   = Retour::where('boutique_id', $boutique->id)
                               ->whereBetween('created_at', [$debut, $fin])
                               ->sum('montant_rembourse');

            $benefice  = $ca - $retours - $coutAchat - $depenses;

            $valeurStock = Variante::where('boutique_id', $boutique->id)
                       ->with('produit')
                       ->get()
                       ->sum(fn($v) => $v->stock_actuel * $this->getPrixAchatVariante($v));

            $dette = (float) ($totalCreditParBoutique[$boutique->id] ?? 0)
                - (float) ($totalPayeParBoutique[$boutique->id] ?? 0)
                + (float) ($totalDetteInitialeParBoutique[$boutique->id] ?? 0)
                - (float) ($totalPayeDetteInitialeParBoutique[$boutique->id] ?? 0);

            $caTotal       += $ca;
            $beneficeTotal += $benefice;
            $depensesTotal += $depenses;
            $dettesTotal   += $dette;
            $stockTotal    += $valeurStock;

            $result[] = [
                'id'       => $boutique->id,
                'nom'      => $boutique->nom,
                'ca'       => $ca,
                'benefice' => $benefice,
                'depenses' => $depenses,
                'dettes'   => $dette,
                'stock'    => $valeurStock,
            ];
        }

        // Classement par CA décroissant
        usort($result, fn($a, $b) => $b['ca'] <=> $a['ca']);

        return response()->json([
            'periode'              => ['debut' => $debut, 'fin' => $request->fin],
            'ca_total'             => $caTotal,
            'benefice_net_total'   => $beneficeTotal,
            'depenses_totales'     => $depensesTotal,
            'dettes_clients_total' => $dettesTotal,
            'valeur_stock_total'   => $stockTotal,
            'boutiques'            => $result,
        ]);
    }

    // -------------------------------------------------------
    // Export PDF
    // -------------------------------------------------------
    public function export(Request $request, int $boutique_id)
    {
        $request->validate([
            'debut'  => 'required|date',
            'fin'    => 'required|date',
            'format' => 'required|in:pdf,excel',
            'type'   => 'required|in:ca,stock,dettes,depenses',
        ]);

        $boutique    = Boutique::findOrFail($boutique_id);
        $fakeRequest = new Request($request->all());

        $data = match($request->type) {
            'ca'      => $this->ca($fakeRequest, $boutique_id)->getData(true),
            'stock'   => $this->stock($fakeRequest, $boutique_id)->getData(true),
            'dettes'  => $this->dettes($fakeRequest, $boutique_id)->getData(true),
            'depenses'=> $this->depenses($fakeRequest, $boutique_id)->getData(true),
        };

        $filename = 'rapport-' . $request->type . '-' . $request->debut;

        if ($request->format === 'pdf') {
            $pdf = Pdf::loadView('rapports.' . $request->type, [
                'data'     => $data,
                'boutique' => $boutique,
            ]);
            return $pdf->download($filename . '.pdf');
        }

        return Excel::download(
            new RapportExport($request->type, $data),
            $filename . '.xlsx'
        );
    }

    // Ajouter cette nouvelle méthode pour l'export consolidé
    public function exportConsolide(Request $request)
    {
        $request->validate([
            'debut'  => 'required|date',
            'fin'    => 'required|date',
            'format' => 'required|in:pdf,excel',
        ]);

        $fakeRequest = new Request($request->all());
        $data        = $this->consolide($fakeRequest)->getData(true);
        $filename    = 'rapport-consolide-' . $request->debut;

        if ($request->format === 'excel') {
            return Excel::download(
                new RapportExport('consolide', $data),
                $filename . '.xlsx'
            );
        }

        // PDF consolidé — vue simple
        $logoPath = public_path('images/logo.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        $pdf = Pdf::loadView('rapports.consolide', [
            'data'     => $data,
            'boutique' => (object)[
                'nom'            => 'Rapport Consolidé — Toutes Boutiques',
                'adresse'        => null,
                'telephone'      => null,
                'slogan'         => null,
                'mention_legale' => null,
                'logo_base64'    => $logoBase64,
            ],
        ]);
        return $pdf->download($filename . '.pdf');
    }
}