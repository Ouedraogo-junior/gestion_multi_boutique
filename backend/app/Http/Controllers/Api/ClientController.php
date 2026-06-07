<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\PaiementClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Vente;

class ClientController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = Client::where('boutique_id', $boutique_id);
        $query = Client::where('boutique_id', $boutique_id)->avecDette();

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
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);
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

        $dettes = DB::select("
            SELECT
                v.id AS vente_id,
                v.numero_facture,
                v.date_validation,
                v.total_net,
                (SELECT COALESCE(SUM(vp.montant), 0) FROM vente_paiements vp WHERE vp.vente_id = v.id AND vp.mode = 'credit') AS total_credit,
                (SELECT COALESCE(SUM(pc.montant), 0) FROM paiements_clients pc WHERE pc.vente_id = v.id) AS total_paye,
                (SELECT COALESCE(SUM(vp.montant), 0) FROM vente_paiements vp WHERE vp.vente_id = v.id AND vp.mode = 'credit')
                - (SELECT COALESCE(SUM(pc.montant), 0) FROM paiements_clients pc WHERE pc.vente_id = v.id) AS solde_restant
            FROM ventes v
            WHERE v.client_id = ? AND v.statut = 'validee' AND v.boutique_id = ?
            HAVING solde_restant > 0
        ", [$id, $boutique_id]);

        $totalDette = collect($dettes)->sum('solde_restant');

        return response()->json([
            'client'      => $client,
            'total_dette' => $totalDette,
            'dettes'      => $dettes,
        ]);
    }

    public function storePaiement(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'vente_id'     => 'required|exists:ventes,id',
            'montant'      => 'required|numeric|min:1',
            'mode'         => 'required|in:especes,mobile_money',
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

        $request->auditAction = 'dette_encaissee';
        $request->auditModule = 'clients';
        $request->auditDetails = [
            'client_id' => $id,
            'vente_id'  => $vente->id,
            'montant'   => $data['montant'],
        ];

        return response()->json($paiement, 201);
    }

    public function paiements(int $boutique_id, int $id): JsonResponse
    {
        $client = Client::where('boutique_id', $boutique_id)->findOrFail($id);

        $paiements = PaiementClient::where('client_id', $id)
            ->where('boutique_id', $boutique_id)
            ->with('vente:id,numero_facture,total_net')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($p) => [
                'id'      => $p->id,
                'montant' => $p->montant,
                'mode'    => $p->mode,
                'date'    => $p->created_at,
                'vente'   => [
                    'numero_facture' => $p->vente->numero_facture,
                    'total_net'      => $p->vente->total_net,
                    'solde_restant'  => $this->calculerSolde($p->vente),
                ],
            ]);

        return response()->json($paiements);
    }

    private function calculerSolde(Vente $vente): float
    {
        $totalCredit = $vente->paiements()->where('mode', 'credit')->sum('montant');
        $totalPaye   = PaiementClient::where('vente_id', $vente->id)->sum('montant');
        return (float) ($totalCredit - $totalPaye);
    }
}