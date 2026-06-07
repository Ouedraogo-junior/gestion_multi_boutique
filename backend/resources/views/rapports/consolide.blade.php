@extends('rapports.layout')

@section('titre', 'Rapport Consolidé')
@section('sous_titre',
    'Du ' . \Carbon\Carbon::parse($data['periode']['debut'])->format('d/m/Y') .
    ' au ' . \Carbon\Carbon::parse($data['periode']['fin'])->format('d/m/Y')
)

@section('contenu')
    <div class="kpis">
        <div class="kpi"><p class="label">CA Total</p><p class="val green">{{ number_format($data['ca_total'], 0, ',', ' ') }} FCFA</p></div>
        <div class="kpi"><p class="label">Bénéfice net</p><p class="val {{ $data['benefice_net_total'] >= 0 ? 'green' : 'red' }}">{{ number_format($data['benefice_net_total'], 0, ',', ' ') }} FCFA</p></div>
        <div class="kpi"><p class="label">Dépenses</p><p class="val red">{{ number_format($data['depenses_totales'], 0, ',', ' ') }} FCFA</p></div>
        <div class="kpi"><p class="label">Dettes clients</p><p class="val red">{{ number_format($data['dettes_clients_total'], 0, ',', ' ') }} FCFA</p></div>
        <div class="kpi"><p class="label">Valeur stock</p><p class="val">{{ number_format($data['valeur_stock_total'], 0, ',', ' ') }} FCFA</p></div>
    </div>

    <h3>Détail par boutique</h3>
    <table>
        <thead>
            <tr>
                <th>Boutique</th><th>CA</th><th>Bénéfice</th><th>Dépenses</th><th>Dettes</th><th>Stock</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['boutiques'] as $b)
            <tr>
                <td><strong>{{ $b['nom'] }}</strong></td>
                <td>{{ number_format($b['ca'], 0, ',', ' ') }} FCFA</td>
                <td class="{{ $b['benefice'] >= 0 ? 'green' : 'red' }}">{{ number_format($b['benefice'], 0, ',', ' ') }} FCFA</td>
                <td class="red">{{ number_format($b['depenses'], 0, ',', ' ') }} FCFA</td>
                <td class="red">{{ number_format($b['dettes'], 0, ',', ' ') }} FCFA</td>
                <td>{{ number_format($b['stock'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endsection