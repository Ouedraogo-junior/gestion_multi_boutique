@extends('rapports.layout')

@section('titre', 'Rapport Dettes Clients')
@section('sous_titre', 'Généré le ' . now()->format('d/m/Y'))

@section('contenu')
    <div class="kpi" style="background:#FEF2F2; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
        <p>Total créances</p>
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
@endsection