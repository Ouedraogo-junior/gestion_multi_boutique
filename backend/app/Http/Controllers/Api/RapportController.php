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
                       ->with(['details', 'paiements'])
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
        $parMode = ['especes' => 0, 'mobile_money' => 0, 'credit' => 0];
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
                $prixAchat = $variante?->produit?->prix_achat ?? 0;
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
                'count_validees'  => $ventes->count(),
                'count_brouillons'=> Vente::where('boutique_id', $boutique_id)
                                          ->where('statut', 'brouillon')
                                          ->count(),
                'par_mode'        => $parMode,
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

        $valeurStock = $variantes->sum(fn($v) => $v->stock_actuel * ($v->produit?->prix_achat ?? 0));
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
                'valeur'        => $v->stock_actuel * ($v->produit?->prix_achat ?? 0),
            ]),
        ]);
    }

    // -------------------------------------------------------
    // Rapport dettes clients
    // -------------------------------------------------------
    public function dettes(int $boutique_id): JsonResponse
    {
        $dettes = DB::select("
            SELECT
                c.id AS client_id,
                c.nom,
                c.prenom,
                c.telephone,
                COALESCE(SUM(vp.montant), 0) AS total_credit,
                COALESCE(SUM(pc.montant), 0) AS total_paye,
                COALESCE(SUM(vp.montant), 0) - COALESCE(SUM(pc.montant), 0) AS solde_dette
            FROM clients c
            LEFT JOIN ventes v ON v.client_id = c.id AND v.statut = 'validee'
            LEFT JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
            LEFT JOIN paiements_clients pc ON pc.client_id = c.id
            WHERE c.boutique_id = ?
            GROUP BY c.id, c.nom, c.prenom, c.telephone
            HAVING solde_dette > 0
            ORDER BY solde_dette DESC
        ", [$boutique_id]);

        return response()->json([
            'boutique_id'  => $boutique_id,
            'total_dettes' => collect($dettes)->sum('solde_dette'),
            'clients'      => $dettes,
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
                    $coutAchat += ($detail->variante?->produit?->prix_achat ?? 0) * $detail->quantite;
                }
            }

            $retours   = Retour::where('boutique_id', $boutique->id)
                               ->whereBetween('created_at', [$debut, $fin])
                               ->sum('montant_rembourse');

            $benefice  = $ca - $retours - $coutAchat - $depenses;

            $valeurStock = Variante::where('boutique_id', $boutique->id)
                                   ->with('produit')
                                   ->get()
                                   ->sum(fn($v) => $v->stock_actuel * ($v->produit?->prix_achat ?? 0));

            $dettes = DB::select("
                SELECT COALESCE(SUM(vp.montant), 0) - COALESCE(SUM(pc.montant), 0) AS solde
                FROM ventes v
                LEFT JOIN vente_paiements vp ON vp.vente_id = v.id AND vp.mode = 'credit'
                LEFT JOIN paiements_clients pc ON pc.vente_id = v.id
                WHERE v.boutique_id = ? AND v.statut = 'validee'
            ", [$boutique->id]);

            $dette = $dettes[0]->solde ?? 0;

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
            'dettes'  => $this->dettes($boutique_id)->getData(true),
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