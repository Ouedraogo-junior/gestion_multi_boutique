@extends('rapports.layout')

@section('titre', 'Rapport Dettes Clients')
@section('sous_titre',
    isset($data['periode'])
        ? 'Du ' . $data['periode']['debut'] . ' au ' . $data['periode']['fin']
        : 'Généré le ' . now()->format('d/m/Y')
)

@section('contenu')
    <div class="kpi" style="background:#FEF2F2; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
        <p>Total créances (solde actuel)</p>
        <p style="font-size:20px; color:#E8314A; font-weight:bold;">
            {{ number_format($data['total_dettes'], 0, ',', ' ') }} FCFA
        </p>
        <p style="color:#6B7280; font-size:10px;">{{ count($data['clients']) }} client(s) avec dette</p>
    </div>

    <h3>Détail par client</h3>
    <table>
        <thead>
            <tr>
                <th>Client</th>
                <th>Téléphone</th>
                <th class="right">Total crédit</th>
                <th class="right">Total payé</th>
                <th class="right">Solde dû</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['clients'] as $c)
            <tr>
                <td>{{ trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')) }}</td>
                <td>{{ $c['telephone'] ?? '—' }}</td>
                <td class="right">{{ number_format($c['total_credit'], 0, ',', ' ') }} FCFA</td>
                <td class="right green">{{ number_format($c['total_paye'], 0, ',', ' ') }} FCFA</td>
                <td class="right red">{{ number_format($c['solde_dette'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(isset($data['paiements_periode']))
    <div class="kpi" style="background:#D4F0E2; padding:12px 16px; border-radius:6px; margin:16px 0;">
        <p>Paiements reçus sur la période</p>
        <p style="font-size:20px; color:#1A7A4A; font-weight:bold;">
            {{ number_format($data['total_paiements_periode'], 0, ',', ' ') }} FCFA
        </p>
    </div>

    <h3>Historique des paiements</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Origine</th>
                <th>Mode</th>
                <th class="right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['paiements_periode'] as $p)
            <tr>
                <td>{{ \Carbon\Carbon::parse($p['date'])->format('d/m/Y') }}</td>
                <td>{{ trim(($p['prenom'] ?? '') . ' ' . ($p['nom'] ?? '')) }}</td>
                <td>{{ $p['source'] === 'vente' ? ($p['numero_facture'] ?? '—') : 'Dette antérieure' }}</td>
                <td>{{ $p['mode'] === 'especes' ? 'Espèces' : 'Mobile Money' }}</td>
                <td class="right green">{{ number_format($p['montant'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @empty
            <tr><td colspan="5" style="text-align:center; color:#6B7280;">Aucun paiement sur cette période</td></tr>
            @endforelse
        </tbody>
    </table>
    @endif
@endsection