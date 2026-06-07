@extends('rapports.layout')

@section('titre', 'Rapport Stock')
@section('sous_titre', 'Généré le ' . now()->format('d/m/Y'))

@section('contenu')
    <div style="display:flex; gap:12px; margin-bottom:16px;">
        <div class="kpi" style="background:#F4F6F5; padding:12px 16px; border-radius:6px; flex:1;">
            <p style="color:#6B7280; font-size:10px;">Valeur totale stock</p>
            <p style="font-size:18px; font-weight:bold; color:#1A7A4A;">
                {{ number_format($data['valeur_stock'], 0, ',', ' ') }} FCFA
            </p>
        </div>
        <div class="kpi" style="background:#FEF2F2; padding:12px 16px; border-radius:6px; flex:1;">
            <p style="color:#6B7280; font-size:10px;">Articles en alerte</p>
            <p style="font-size:18px; font-weight:bold; color:#E8314A;">
                {{ $data['en_alerte'] }}
            </p>
        </div>
    </div>

    <h3>Détail des variantes</h3>
    <table>
        <thead>
            <tr>
                <th>Référence</th>
                <th>Produit</th>
                <th>Attributs</th>
                <th class="right">Stock</th>
                <th class="right">Seuil</th>
                <th class="right">Valeur</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['variantes'] as $v)
            <tr>
                <td>{{ $v['reference'] }}</td>
                <td>{{ $v['produit'] }}</td>
                <td>{{ $v['attributs'] ? implode(', ', (array)$v['attributs']) : '—' }}</td>
                <td class="right {{ $v['en_alerte'] ? 'red' : 'green' }}">{{ $v['stock_actuel'] }}</td>
                <td class="right">{{ $v['seuil_alerte'] }}</td>
                <td class="right">{{ number_format($v['valeur'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection