@extends('rapports.layout')

@section('titre', 'Rapport Dettes Fournisseurs')
@section('sous_titre',
    isset($data['periode'])
        ? 'Du ' . $data['periode']['debut'] . ' au ' . $data['periode']['fin']
        : 'Généré le ' . now()->format('d/m/Y')
)

@section('contenu')
    <div class="kpi" style="background:#FEF2F2; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
        <p>Total dettes fournisseurs (solde actuel)</p>
        <p style="font-size:20px; color:#E8314A; font-weight:bold;">
            {{ number_format($data['total_dettes'], 0, ',', ' ') }} FCFA
        </p>
        <p style="color:#6B7280; font-size:10px;">{{ count($data['fournisseurs']) }} fournisseur(s) avec dette</p>
    </div>

    <h3>Détail par fournisseur</h3>
    <table>
        <thead>
            <tr>
                <th>Fournisseur</th>
                <th>Téléphone</th>
                <th class="right">Total dû</th>
                <th class="right">Total payé</th>
                <th class="right">Solde dû</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['fournisseurs'] as $f)
            <tr>
                <td>
                    {{ $f['nom'] }}
                    @if(!empty($f['provenance']))
                        <span style="color:#6B7280;"> · {{ $f['provenance'] }}</span>
                    @endif
                </td>
                <td>{{ $f['telephone'] ?? '—' }}</td>
                <td class="right">{{ number_format($f['total_du'], 0, ',', ' ') }} FCFA</td>
                <td class="right green">{{ number_format($f['total_paye'], 0, ',', ' ') }} FCFA</td>
                <td class="right red">{{ number_format($f['solde_dette'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(isset($data['paiements_periode']))
    <div class="kpi" style="background:#D4F0E2; padding:12px 16px; border-radius:6px; margin:16px 0;">
        <p>Paiements effectués sur la période</p>
        <p style="font-size:20px; color:#1A7A4A; font-weight:bold;">
            {{ number_format($data['total_paiements_periode'], 0, ',', ' ') }} FCFA
        </p>
    </div>

    <h3>Historique des paiements</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Approvisionnement</th>
                <th class="right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['paiements_periode'] as $p)
            <tr>
                <td>{{ \Carbon\Carbon::parse($p['date'])->format('d/m/Y') }}</td>
                <td>{{ $p['nom'] }}</td>
                <td>{{ $p['numero_approvisionnement'] ?? '—' }}</td>
                <td class="right green">{{ number_format($p['montant'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @empty
            <tr><td colspan="4" style="text-align:center; color:#6B7280;">Aucun paiement sur cette période</td></tr>
            @endforelse
        </tbody>
    </table>
    @endif
@endsection