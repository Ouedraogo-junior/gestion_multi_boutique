@extends('rapports.layout')

@section('titre', 'Rapport Chiffre d\'Affaires')
@section('sous_titre', 'Du ' . $data['periode']['debut'] . ' au ' . $data['periode']['fin'])

@section('contenu')
    <h3>Chiffre d'affaires</h3>
    <table>
        <tr><td>CA Brut</td><td class="right">{{ number_format($data['ca']['brut'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Retours</td><td class="right">- {{ number_format($data['ca']['retours'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Remises</td><td class="right">- {{ number_format($data['ca']['total_remises'], 0, ',', ' ') }} FCFA</td></tr>
        <tr class="total"><td>CA Net</td><td class="right">{{ number_format($data['ca']['net'], 0, ',', ' ') }} FCFA</td></tr>
    </table>

    <h3>Coûts & Marges</h3>
    <table>
        <tr><td>Coût d'achat</td><td class="right">{{ number_format($data['couts']['achat'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Marge brute</td><td class="right">{{ number_format($data['couts']['marge_brute'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Dépenses</td><td class="right">- {{ number_format($data['couts']['depenses'], 0, ',', ' ') }} FCFA</td></tr>
        <tr class="total"><td>Bénéfice net</td><td class="right">{{ number_format($data['couts']['benefice_net'], 0, ',', ' ') }} FCFA</td></tr>
    </table>

    <h3>Ventes</h3>
    <table>
        <tr><td>Ventes validées</td><td class="right">{{ $data['ventes']['count_validees'] }}</td></tr>
        <tr><td>Espèces</td><td class="right">{{ number_format($data['ventes']['par_mode']['especes'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Mobile Money</td><td class="right">{{ number_format($data['ventes']['par_mode']['mobile_money'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Crédit</td><td class="right">{{ number_format($data['ventes']['par_mode']['credit'], 0, ',', ' ') }} FCFA</td></tr>
    </table>
@endsection