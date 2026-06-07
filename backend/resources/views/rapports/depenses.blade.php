@extends('rapports.layout')

@section('titre', 'Rapport Dépenses')
@section('sous_titre',
    'Du ' . \Carbon\Carbon::parse($data['periode']['debut'])->format('d/m/Y') .
    ' au ' . \Carbon\Carbon::parse($data['periode']['fin'])->format('d/m/Y')
)

@section('contenu')
    <div class="kpi" style="background:#FEF2F2; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
        <p>Total dépenses</p>
        <p style="font-size:20px; color:#E8314A; font-weight:bold;">
            {{ number_format($data['total'], 0, ',', ' ') }} FCFA
        </p>
    </div>

    @if(!empty($data['par_categorie']))
        <h3>Par catégorie</h3>
        <table>
            @foreach($data['par_categorie'] as $cat => $montant)
            <tr>
                <td>{{ $cat }}</td>
                <td class="right red">{{ number_format($montant, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </table>
    @endif

    <h3>Détail des dépenses</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th class="right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['depenses'] as $d)
            <tr>
                <td>{{ \Carbon\Carbon::parse($d['date'])->format('d/m/Y') }}</td>
                <td>{{ $d['description'] ?? '—' }}</td>
                <td><span style="background:#F4F6F5; padding:2px 6px; border-radius:4px; font-size:10px; color:#6B7280;">{{ $d['categorie']['libelle'] ?? 'Non catégorisé' }}</span></td>
                <td class="right red">{{ number_format($d['montant'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection