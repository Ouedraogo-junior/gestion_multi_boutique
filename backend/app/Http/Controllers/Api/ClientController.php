<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\PaiementClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Vente;
use App\Models\AvanceClient;
use App\Models\VentePaiement;
use App\Models\DetteInitiale;
use App\Models\DetteInitialePaiement;

class ClientController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Client::where('boutique_id', $boutique_id)->avecDette($boutique_id);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', '%' . $request->search . '%')
                ->orWhere('prenom', 'like', '%' . $request->search . '%')
                ->orWhere('telephone', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->orderBy('nom')->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'nom'       => 'required|string|max:100',
            'prenom'    => 'nullable|string|max:100',
            'telephone' => 'nullable|string|max:30',
            'adresse'   => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
            'est_boutique' => 'sometimes|boolean',
        ]);

        $data['boutique_id'] = $boutique_id;
        $client = Client::create($data);

        $request->auditAction = 'client_cree';
        $request->auditModule = 'clients';
        $request->auditDetails = ['apres' => $client->toArray()];

        return response()->json($client, 201);
    }

    public function show(int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)
            ->avecDette($boutique_id)
            ->where('clients.id', $id)
            ->firstOrFail();

        return response()->json($client);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);
        $avant = $client->toArray();

        $data = $request->validate([
            'nom'       => 'sometimes|string|max:100',
            'prenom'    => 'nullable|string|max:100',
            'telephone' => 'nullable|string|max:30',
            'adresse'   => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
            'est_boutique' => 'sometimes|boolean',
        ]);

        $client->update($data);

        $request->auditAction = 'client_modifie';
        $request->auditModule = 'clients';
        $request->auditDetails = ['avant' => $avant, 'apres' => $client->fresh()->toArray()];

        return response()->json($client->fresh());
    }

    public function dettes(int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $dettesVentes = DB::select("
            SELECT
                vente_id, numero_facture, date_validation, total_net,
                total_credit, total_paye,
                (total_credit - total_paye) AS solde_restant
            FROM (
                SELECT
                    v.id AS vente_id,
                    v.numero_facture,
                    v.date_validation,
                    v.total_net,
                    (SELECT COALESCE(SUM(vp.montant), 0) FROM vente_paiements vp WHERE vp.vente_id = v.id AND vp.mode = 'credit') AS total_credit,
                    (SELECT COALESCE(SUM(pc.montant), 0) FROM paiements_clients pc WHERE pc.vente_id = v.id) AS total_paye
                FROM ventes v
                WHERE v.client_id = ? AND v.statut = 'validee' AND v.boutique_id = ?
            ) sub
            HAVING solde_restant > 0
        ", [$id, $boutique_id]);

        $dettesInitiales = DB::select("
            SELECT
                di.id AS dette_initiale_id, di.date, di.montant AS montant_initial, di.note,
                COALESCE(SUM(dip.montant), 0) AS total_paye,
                di.montant - COALESCE(SUM(dip.montant), 0) AS solde_restant
            FROM dettes_initiales di
            LEFT JOIN dette_initiale_paiements dip ON dip.dette_initiale_id = di.id
            WHERE di.client_id = ? AND di.boutique_id = ?
            GROUP BY di.id, di.date, di.montant, di.note
            HAVING solde_restant > 0
        ", [$id, $boutique_id]);

        $totalDette = collect($dettesVentes)->sum('solde_restant') + collect($dettesInitiales)->sum('solde_restant');

        return response()->json([
            'client'           => $client,
            'total_dette'      => $totalDette,
            'dettes'           => $dettesVentes,
            'dettes_initiales' => $dettesInitiales,
        ]);
    }

    public function storePaiement(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'vente_id'     => 'required|exists:ventes,id',
            'montant'      => 'required|numeric|min:1',
            'mode'         => 'required|in:especes,mobile_money,avance_client',
            'operateur_id' => 'nullable|exists:referentiels,id',
            'note'         => 'nullable|string',
            'date'         => 'required|date',
        ]);

        // Vérifier que la vente appartient bien à ce client et à cette boutique
        $vente = \App\Models\Vente::where('boutique_id', $boutique_id)
                                ->where('client_id', $id)
                                ->where('statut', 'validee')
                                ->findOrFail($data['vente_id']);

        // Calculer le solde restant pour cette vente
        $totalCredit = $vente->paiements()->where('mode', 'credit')->sum('montant');
        $totalPaye   = PaiementClient::where('vente_id', $vente->id)->sum('montant');
        $soldeRestant = $totalCredit - $totalPaye;

        if ($data['montant'] > $soldeRestant) {
            return response()->json([
                'message'       => 'Montant supérieur au solde restant',
                'solde_restant' => $soldeRestant,
            ], 422);
        }

        // Vérification spécifique au paiement par avance
        if ($data['mode'] === 'avance_client' && $data['montant'] > $client->solde_avance) {
            return response()->json([
                'message'      => 'Solde d\'avance insuffisant',
                'solde_avance' => $client->solde_avance,
            ], 422);
        }

        DB::beginTransaction();
        try {
            $paiement = PaiementClient::create([
                'boutique_id'  => $boutique_id,
                'client_id'    => $id,
                'vente_id'     => $vente->id,
                'montant'      => $data['montant'],
                'mode'         => $data['mode'],
                'operateur_id' => $data['operateur_id'] ?? null,
                'user_id'      => auth()->id(),
                'note'         => $data['note'] ?? null,
                'date'         => $data['date'],
                'created_at'   => now(),
            ]);

            if ($data['mode'] === 'avance_client') {
                AvanceClient::create([
                    'boutique_id' => $boutique_id,
                    'client_id'   => $id,
                    'type'        => 'utilisation',
                    'montant'     => $data['montant'],
                    'vente_id'    => $vente->id,
                    'user_id'     => auth()->id(),
                    'note'        => 'Utilisée pour régler la dette de la vente ' . $vente->numero_facture,
                    'created_at'  => now(),
                ]);
            }

            DB::commit();

            $request->auditAction = 'dette_encaissee';
            $request->auditModule = 'clients';
            $request->auditDetails = [
                'client_id' => $id,
                'vente_id'  => $vente->id,
                'montant'   => $data['montant'],
                'mode'      => $data['mode'],
            ];

            return response()->json($paiement, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }

    public function paiements(int $boutique_id, int $id): JsonResponse
    {
        Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $paiementsVentes = DB::table('paiements_clients as pc')
            ->join('ventes as v', 'v.id', '=', 'pc.vente_id')
            ->where('pc.client_id', $id)
            ->where('pc.boutique_id', $boutique_id)
            ->select([
                'pc.id', 'pc.montant', 'pc.mode', 'pc.note', 'pc.created_at as date',
                DB::raw("'vente' as source"),
                'pc.vente_id',
                DB::raw('NULL as dette_initiale_id'),
                'v.numero_facture',
                'v.total_net',
            ]);

        $paiementsDettesInitiales = DB::table('dette_initiale_paiements as dip')
            ->where('dip.client_id', $id)
            ->where('dip.boutique_id', $boutique_id)
            ->select([
                'dip.id', 'dip.montant', 'dip.mode', 'dip.note', 'dip.created_at as date',
                DB::raw("'dette_initiale' as source"),
                DB::raw('NULL as vente_id'),
                'dip.dette_initiale_id',
                DB::raw('NULL as numero_facture'),
                DB::raw('NULL as total_net'),
            ]);

        $rows = $paiementsVentes->unionAll($paiementsDettesInitiales)
            ->orderByDesc('date')
            ->limit(200)
            ->get();

        $venteIds = $rows->where('source', 'vente')->pluck('vente_id')->filter()->unique()->values();
        $detteIds = $rows->where('source', 'dette_initiale')->pluck('dette_initiale_id')->filter()->unique()->values();

        $creditParVente = VentePaiement::whereIn('vente_id', $venteIds)->where('mode', 'credit')
            ->groupBy('vente_id')->selectRaw('vente_id, SUM(montant) as total')->pluck('total', 'vente_id');
        $payeParVente = PaiementClient::whereIn('vente_id', $venteIds)
            ->groupBy('vente_id')->selectRaw('vente_id, SUM(montant) as total')->pluck('total', 'vente_id');

        $montantDette = DetteInitiale::whereIn('id', $detteIds)->pluck('montant', 'id');
        $payeParDette = DetteInitialePaiement::whereIn('dette_initiale_id', $detteIds)
            ->groupBy('dette_initiale_id')->selectRaw('dette_initiale_id, SUM(montant) as total')->pluck('total', 'dette_initiale_id');

        $result = $rows->map(function ($p) use ($creditParVente, $payeParVente, $montantDette, $payeParDette) {
            $base = [
                'id'      => $p->id,
                'montant' => (float) $p->montant,
                'mode'    => $p->mode,
                'date'    => $p->date,
                'note'    => $p->note,
                'source'  => $p->source,
            ];

            if ($p->source === 'vente') {
                $solde = (float) ($creditParVente[$p->vente_id] ?? 0) - (float) ($payeParVente[$p->vente_id] ?? 0);
                return $base + [
                    'vente_id' => $p->vente_id,
                    'vente'    => [
                        'numero_facture' => $p->numero_facture,
                        'total_net'      => (float) $p->total_net,
                        'solde_restant'  => $solde,
                    ],
                ];
            }

            $solde = (float) ($montantDette[$p->dette_initiale_id] ?? 0) - (float) ($payeParDette[$p->dette_initiale_id] ?? 0);
            return $base + [
                'dette_initiale_id' => $p->dette_initiale_id,
                'dette_initiale'    => ['solde_restant' => $solde],
            ];
        });

        return response()->json($result->values());
    }

   public function stats(int $boutique_id): JsonResponse
    {
        $result = Client::where('boutique_id', $boutique_id)
            ->avecDette($boutique_id)
            ->select(DB::raw('
                COUNT(clients.id) AS total_clients,
                COUNT(CASE WHEN dette.total_dette > 0 THEN 1 END) AS avec_dette,
                COALESCE(SUM(CASE WHEN dette.total_dette > 0 THEN dette.total_dette END), 0) AS total_dettes
            '))
            ->toBase()
            ->first();

        $recouvrementJour = DB::table('paiements_clients')
            ->where('boutique_id', $boutique_id)
            ->whereDate('date', now()->toDateString())
            ->sum('montant');

        return response()->json([
            'total_clients'      => $result->total_clients,
            'avec_dette'         => $result->avec_dette,
            'total_dettes'       => $result->total_dettes,
            'recouvrement_jour'  => $recouvrementJour,
        ]);
    }

    public function derniersPaiements(Request $request, int $boutique_id): JsonResponse
    {
        $clientIds = $request->input('client_ids', []);

        $dernierVente = DB::table('paiements_clients as pc')
            ->join('ventes as v', 'v.id', '=', 'pc.vente_id')
            ->select('pc.id', 'pc.client_id', 'pc.montant', 'pc.mode', 'pc.created_at as date',
                    'v.numero_facture', 'v.total_net', DB::raw("'vente' as source"))
            ->where('pc.boutique_id', $boutique_id)
            ->whereIn('pc.id', function ($sub) use ($boutique_id, $clientIds) {
                $sub->select(DB::raw('MAX(id)'))->from('paiements_clients')
                    ->where('boutique_id', $boutique_id)
                    ->when(!empty($clientIds), fn ($q) => $q->whereIn('client_id', $clientIds))
                    ->groupBy('client_id');
            })
            ->get();

        $dernierDetteInitiale = DB::table('dette_initiale_paiements as dip')
            ->select('dip.id', 'dip.client_id', 'dip.montant', 'dip.mode', 'dip.created_at as date',
                    DB::raw('NULL as numero_facture'), DB::raw('NULL as total_net'), DB::raw("'dette_initiale' as source"))
            ->where('dip.boutique_id', $boutique_id)
            ->whereIn('dip.id', function ($sub) use ($boutique_id, $clientIds) {
                $sub->select(DB::raw('MAX(id)'))->from('dette_initiale_paiements')
                    ->where('boutique_id', $boutique_id)
                    ->when(!empty($clientIds), fn ($q) => $q->whereIn('client_id', $clientIds))
                    ->groupBy('client_id');
            })
            ->get();

        $map = $dernierVente->concat($dernierDetteInitiale)
            ->groupBy('client_id')
            ->map(fn ($group) => $group->sortByDesc('date')->first());

        return response()->json($map);
    }

    private function calculerSolde(Vente $vente): float
    {
        $totalCredit = $vente->paiements()->where('mode', 'credit')->sum('montant');
        $totalPaye   = PaiementClient::where('vente_id', $vente->id)->sum('montant');
        return (float) ($totalCredit - $totalPaye);
    }

    public function storeAvance(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'montant'      => 'required|numeric|min:1',
            'mode_depot'   => 'required|in:especes,mobile_money',
            'operateur_id' => 'nullable|exists:referentiels,id',
            'note'         => 'nullable|string',
        ]);

        $avance = AvanceClient::create([
            'boutique_id'  => $boutique_id,
            'client_id'    => $id,
            'type'         => 'depot',
            'montant'      => $data['montant'],
            'mode_depot'   => $data['mode_depot'],
            'operateur_id' => $data['operateur_id'] ?? null,
            'user_id'      => auth()->id(),
            'note'         => $data['note'] ?? null,
            'created_at'   => now(),
        ]);

        $request->auditAction  = 'avance_deposee';
        $request->auditModule  = 'clients';
        $request->auditDetails = [
            'client_id'  => $id,
            'montant'    => $data['montant'],
            'mode_depot' => $data['mode_depot'],
        ];

        return response()->json([
            'avance'              => $avance,
            'solde_avance_apres'  => $client->fresh()->solde_avance,
        ], 201);
    }

    public function avances(int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $historique = AvanceClient::where('boutique_id', $boutique_id)
            ->where('client_id', $id)
            ->with('vente:id,numero_facture,total_net')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'client'       => $client,
            'solde_avance' => $client->solde_avance,
            'historique'   => $historique,
        ]);
    }

    public function storeDetteInitiale(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'montant' => 'required|numeric|min:1',
            'date'    => 'required|date',
            'note'    => 'nullable|string',
        ]);

        $dette = DetteInitiale::create([
            'boutique_id' => $boutique_id,
            'client_id'   => $client->id,
            'montant'     => $data['montant'],
            'date'        => $data['date'],
            'note'        => $data['note'] ?? null,
            'user_id'     => auth()->id(),
            'created_at'  => now(),
        ]);

        $request->auditAction  = 'dette_initiale_ajoutee';
        $request->auditModule  = 'clients';
        $request->auditDetails = ['client_id' => $client->id, 'montant' => $data['montant']];

        return response()->json($dette, 201);
    }

    public function storePaiementDetteInitiale(Request $request, int $boutique_id, int $id, int $dette_id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'montant'      => 'required|numeric|min:1',
            'mode'         => 'required|in:especes,mobile_money,avance_client',
            'operateur_id' => 'nullable|exists:referentiels,id',
            'note'         => 'nullable|string',
            'date'         => 'required|date',
        ]);

        DB::beginTransaction();

        try {
            $dette = DetteInitiale::where('boutique_id', $boutique_id)
                                ->where('client_id', $id)
                                ->lockForUpdate()
                                ->findOrFail($dette_id);

            $totalPaye    = DetteInitialePaiement::where('dette_initiale_id', $dette->id)->sum('montant');
            $soldeRestant = $dette->montant - $totalPaye;

            if ($data['montant'] > $soldeRestant) {
                DB::rollBack();
                return response()->json([
                    'message'       => 'Montant supérieur au solde restant',
                    'solde_restant' => $soldeRestant,
                ], 422);
            }

            if ($data['mode'] === 'avance_client' && $data['montant'] > $client->solde_avance) {
                DB::rollBack();
                return response()->json([
                    'message'      => 'Solde d\'avance insuffisant',
                    'solde_avance' => $client->solde_avance,
                ], 422);
            }

            $paiement = DetteInitialePaiement::create([
                'boutique_id'       => $boutique_id,
                'dette_initiale_id' => $dette->id,
                'client_id'         => $id,
                'montant'           => $data['montant'],
                'mode'              => $data['mode'],
                'operateur_id'      => $data['operateur_id'] ?? null,
                'user_id'           => auth()->id(),
                'note'              => $data['note'] ?? null,
                'date'              => $data['date'],
                'created_at'        => now(),
            ]);

            if ($data['mode'] === 'avance_client') {
                AvanceClient::create([
                    'boutique_id'       => $boutique_id,
                    'client_id'         => $id,
                    'type'              => 'utilisation',
                    'montant'           => $data['montant'],
                    'dette_initiale_id' => $dette->id,
                    'user_id'           => auth()->id(),
                    'note'              => 'Utilisée pour régler la dette antérieure',
                    'created_at'        => now(),
                ]);
            }

            DB::commit();

            $request->auditAction  = 'dette_initiale_encaissee';
            $request->auditModule  = 'clients';
            $request->auditDetails = ['client_id' => $id, 'dette_initiale_id' => $dette->id, 'montant' => $data['montant'], 'mode' => $data['mode']];

            return response()->json($paiement, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur : ' . $e->getMessage()], 500);
        }
    }
}