<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActiviteController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'debut'    => 'required|date',
            'fin'      => 'required|date|after_or_equal:debut',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $debut = $data['debut'] . ' 00:00:00';
        $fin   = $data['fin']   . ' 23:59:59';

        // 1. Ventes validées
        $ventesQuery = DB::table('ventes as v')
            ->leftJoin('clients as c', 'c.id', '=', 'v.client_id')
            ->where('v.boutique_id', $boutique_id)
            ->where('v.statut', 'validee')
            ->whereBetween('v.date_validation', [$debut, $fin])
            ->select([
                DB::raw("'vente' as type"),
                'v.id',
                'v.date_validation as date',
                'v.numero_facture',
                'v.total_net as montant',
                'v.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                DB::raw('NULL as mode'),
                DB::raw('NULL as note'),
            ]);

        // 2. Dettes antérieures créées
        $dettesInitialesQuery = DB::table('dettes_initiales as di')
            ->leftJoin('clients as c', 'c.id', '=', 'di.client_id')
            ->where('di.boutique_id', $boutique_id)
            ->whereBetween('di.created_at', [$debut, $fin])
            ->select([
                DB::raw("'dette_initiale' as type"),
                'di.id',
                'di.created_at as date',
                DB::raw('NULL as numero_facture'),
                'di.montant',
                'di.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                DB::raw('NULL as mode'),
                'di.note',
            ]);

        // 3. Remboursements sur ventes à crédit
        $paiementsVenteQuery = DB::table('paiements_clients as pc')
            ->join('ventes as v', 'v.id', '=', 'pc.vente_id')
            ->leftJoin('clients as c', 'c.id', '=', 'pc.client_id')
            ->where('pc.boutique_id', $boutique_id)
            ->whereBetween('pc.created_at', [$debut, $fin])
            ->select([
                DB::raw("'paiement_vente' as type"),
                'pc.id',
                'pc.created_at as date',
                'v.numero_facture',
                'pc.montant',
                'pc.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                'pc.mode',
                DB::raw('NULL as note'),
            ]);

        // 4. Remboursements sur dettes antérieures
        $paiementsDetteInitialeQuery = DB::table('dette_initiale_paiements as dip')
            ->leftJoin('clients as c', 'c.id', '=', 'dip.client_id')
            ->where('dip.boutique_id', $boutique_id)
            ->whereBetween('dip.created_at', [$debut, $fin])
            ->select([
                DB::raw("'paiement_dette_initiale' as type"),
                'dip.id',
                'dip.created_at as date',
                DB::raw('NULL as numero_facture'),
                'dip.montant',
                'dip.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                'dip.mode',
                DB::raw('NULL as note'),
            ]);

        
        // 5. Avances — dépôts (argent réel reçu, pas encore lié à une vente)
        $avancesDepotsQuery = DB::table('avances_clients as ac')
            ->leftJoin('clients as c', 'c.id', '=', 'ac.client_id')
            ->where('ac.boutique_id', $boutique_id)
            ->where('ac.type', 'depot')
            ->whereBetween('ac.created_at', [$debut, $fin])
            ->select([
                DB::raw("'avance_depot' as type"),
                'ac.id',
                'ac.created_at as date',
                DB::raw('NULL as numero_facture'),
                'ac.montant',
                'ac.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                'ac.mode_depot as mode',
                'ac.note',
            ]);

        // 6. Avances — utilisations (consommées sur une vente)
        $avancesUtilisationsQuery = DB::table('avances_clients as ac')
            ->leftJoin('clients as c', 'c.id', '=', 'ac.client_id')
            ->leftJoin('ventes as v', 'v.id', '=', 'ac.vente_id')
            ->where('ac.boutique_id', $boutique_id)
            ->where('ac.type', 'utilisation')
            ->whereBetween('ac.created_at', [$debut, $fin])
            ->select([
                DB::raw("'avance_utilisation' as type"),
                'ac.id',
                'ac.created_at as date',
                'v.numero_facture',
                'ac.montant',
                'ac.client_id',
                DB::raw("TRIM(CONCAT(COALESCE(c.prenom, ''), ' ', COALESCE(c.nom, ''))) as client_nom"),
                DB::raw('NULL as mode'),
                DB::raw('NULL as note'),
            ]);

        $page = $ventesQuery
            ->unionAll($dettesInitialesQuery)
            ->unionAll($paiementsVenteQuery)
            ->unionAll($paiementsDetteInitialeQuery)
            ->unionAll($avancesDepotsQuery)
            ->unionAll($avancesUtilisationsQuery)
            ->orderByDesc('date')
            ->paginate($data['per_page'] ?? 25);

        $items = collect($page->items());

        // Enrichissement des lignes "vente" UNIQUEMENT sur la page courante (pas de N+1)
        $venteIds = $items->where('type', 'vente')->pluck('id');

        $creditParVente = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIds)->where('mode', 'credit')
            ->groupBy('vente_id')->selectRaw('vente_id, SUM(montant) as total')
            ->pluck('total', 'vente_id');

        $cashParVente = DB::table('vente_paiements')
            ->whereIn('vente_id', $venteIds)->whereIn('mode', ['especes', 'mobile_money'])
            ->groupBy('vente_id')->selectRaw('vente_id, SUM(montant) as total')
            ->pluck('total', 'vente_id');

        $rembourseParVente = DB::table('paiements_clients')
            ->whereIn('vente_id', $venteIds)
            ->groupBy('vente_id')->selectRaw('vente_id, SUM(montant) as total')
            ->pluck('total', 'vente_id');

        // Enrichissement des lignes "dette_initiale" — solde actuel
        $detteInitialeIds = $items->where('type', 'dette_initiale')->pluck('id');

        $rembourseParDetteInitiale = DB::table('dette_initiale_paiements')
            ->whereIn('dette_initiale_id', $detteInitialeIds)
            ->groupBy('dette_initiale_id')->selectRaw('dette_initiale_id, SUM(montant) as total')
            ->pluck('total', 'dette_initiale_id');

        $result = $items->map(function ($row) use ($creditParVente, $cashParVente, $rembourseParVente, $rembourseParDetteInitiale) {
            $base = [
                'type'           => $row->type,
                'id'             => $row->id,
                'date'           => $row->date,
                'client_nom'     => $row->client_nom ?: null,
                'montant'        => (float) $row->montant,
                'numero_facture' => $row->numero_facture,
                'mode'           => $row->mode,
                'note'           => $row->note,
            ];

            if ($row->type === 'vente') {
                $credit    = (float) ($creditParVente[$row->id] ?? 0);
                $cash      = (float) ($cashParVente[$row->id] ?? 0);
                $rembourse = (float) ($rembourseParVente[$row->id] ?? 0);
                $resteDu   = max(0, $credit - $rembourse);

                $categorie = $credit === 0.0 ? 'reglee' : ($cash > 0 ? 'partielle' : 'credit_total');

                return $base + [
                    'credit_accorde' => $credit,
                    'cash'           => $cash,
                    'rembourse'      => $rembourse,
                    'reste_du'       => $resteDu,
                    'categorie'      => $categorie,
                ];
            }

            if ($row->type === 'dette_initiale') {
                $rembourse = (float) ($rembourseParDetteInitiale[$row->id] ?? 0);
                return $base + [
                    'rembourse' => $rembourse,
                    'reste_du'  => max(0, (float) $row->montant - $rembourse),
                ];
            }

            return $base;
        });

        $page->setCollection($result);
        return response()->json($page);
    }
}