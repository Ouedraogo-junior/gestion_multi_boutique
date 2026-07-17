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

    @if(isset($data['ventes']['sans_credit']))
    <h3>Répartition des ventes</h3>
    <table>
        <tr>
            <td>Réglées intégralement</td>
            <td class="right green">{{ number_format($data['ventes']['sans_credit']['montant'], 0, ',', ' ') }} FCFA</td>
            <td class="right">({{ $data['ventes']['sans_credit']['count'] }} vente(s))</td>
        </tr>
        <tr>
            <td>Règlements partiels — dont réglé comptant</td>
            <td class="right">{{ number_format($data['ventes']['partielles']['montant_regle'], 0, ',', ' ') }} FCFA</td>
            <td class="right">({{ $data['ventes']['partielles']['count'] }} vente(s))</td>
        </tr>
        <tr>
            <td>Règlements partiels — dont laissé à crédit</td>
            <td class="right red">{{ number_format($data['ventes']['partielles']['montant_credit'], 0, ',', ' ') }} FCFA</td>
            <td></td>
        </tr>
        <tr>
            <td>Entièrement à crédit</td>
            <td class="right red">{{ number_format($data['ventes']['entierement_credit']['montant'], 0, ',', ' ') }} FCFA</td>
            <td class="right">({{ $data['ventes']['entierement_credit']['count'] }} vente(s))</td>
        </tr>
    </table>
    @endif

    @if(isset($data['encaisse']))
    <h3>Argent réellement encaissé sur la période</h3>
    <table>
        <tr><td>Réglé comptant sur les ventes</td><td class="right">{{ number_format($data['encaisse']['regle_sur_ventes'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Recouvrement de dettes</td><td class="right">{{ number_format($data['encaisse']['recouvrement'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Avances déposées</td><td class="right">{{ number_format($data['encaisse']['avances_deposees'], 0, ',', ' ') }} FCFA</td></tr>
        <tr class="total"><td>Total encaissé</td><td class="right green">{{ number_format($data['encaisse']['total'], 0, ',', ' ') }} FCFA</td></tr>
    </table>
    @endif

    @if(isset($data['transferts_boutiques']))
    <h3>Transferts inter-boutiques</h3>
    <table>
        <tr><td>Dû par les boutiques (actuel)</td><td class="right">{{ number_format($data['transferts_boutiques']['creances_actuelles'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Transferts créés sur la période</td><td class="right">{{ number_format($data['transferts_boutiques']['crees_periode'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>Encaissé sur la période</td><td class="right green">{{ number_format($data['transferts_boutiques']['encaisse_periode'], 0, ',', ' ') }} FCFA</td></tr>
        <tr><td>dont réglé via avance</td><td class="right">{{ number_format($data['transferts_boutiques']['regle_avance_periode'], 0, ',', ' ') }} FCFA</td></tr>
    </table>
    @endif

    @if(!empty($data['ventes']['detail']))
    <h3>Détail des ventes de la période</h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Facture</th>
                <th>Client</th>
                <th>Total</th>
                <th class="right">Solde dû (actuel)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['ventes']['detail'] as $v)
            <tr>
                <td>{{ \Carbon\Carbon::parse($v['date_validation'])->format('d/m/Y') }}</td>
                <td>{{ $v['numero_facture'] ?? '—' }}</td>
                <td>{{ $v['client_nom'] ?? 'Anonyme' }}</td>
                <td class="right">{{ number_format($v['total_net'], 0, ',', ' ') }} FCFA</td>
                <td class="right {{ $v['reste_du'] > 0 ? 'red' : '' }}">
                    {{ $v['reste_du'] > 0 ? number_format($v['reste_du'], 0, ',', ' ') . ' FCFA' : '—' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
@endsection