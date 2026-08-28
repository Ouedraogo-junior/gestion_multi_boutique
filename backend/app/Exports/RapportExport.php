<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RapportExport implements WithMultipleSheets
{
    public function __construct(
        private string $type,
        private array  $data
    ) {}

    /**
     * Point d'entrée Maatwebsite Excel : renvoie la liste des onglets du classeur.
     * Le rapport CA a besoin de plusieurs onglets (résumé + détails volumineux) ;
     * tous les autres rapports gardent un classeur à un seul onglet, comme avant.
     */
    public function sheets(): array
    {
        if ($this->type === 'ca') {
            return [
                new RapportSheetExport('Résumé', $this->headingsFor('ca'), $this->rowsCA()),
                new RapportSheetExport(
                    'Détail des ventes',
                    ['Date', 'Facture', 'Client', 'Total (FCFA)', 'Solde dû (FCFA)'],
                    $this->rowsDetailVentes()
                ),
                new RapportSheetExport(
                    'Articles vendus',
                    ['Date', 'Facture', 'Produit', 'Qté', 'Prix achat', 'Prix vente', 'Prix appliqué', 'Écart', 'Montant (FCFA)'],
                    $this->rowsArticlesVendus()
                ),
            ];
        }

        return [
            new RapportSheetExport($this->title(), $this->headingsFor($this->type), $this->rows($this->type)),
        ];
    }

    private function title(): string
    {
        return match($this->type) {
            'ca'          => 'Chiffre d\'affaires',
            'stock'       => 'Stock',
            'dettes'      => 'Dettes clients',
            'depenses'    => 'Dépenses',
            'consolide'   => 'Consolidé',
            'fournisseurs'=> 'Dettes fournisseurs',
            default       => 'Rapport',
        };
    }

    private function headingsFor(string $type): array
    {
        return match($type) {
            'ca'          => ['Indicateur', 'Valeur (FCFA)'],
            'stock'       => ['Produit', 'Référence', 'Attributs', 'Stock actuel', 'Seuil alerte', 'Valeur (FCFA)', 'Statut'],
            'dettes'      => ['Client', 'Téléphone', 'Total crédit', 'Total payé', 'Solde dû'],
            'depenses'    => ['Date', 'Description', 'Catégorie', 'Montant (FCFA)'],
            'consolide'   => ['Boutique', 'CA (FCFA)', 'Bénéfice (FCFA)', 'Dépenses (FCFA)', 'Dettes (FCFA)', 'Stock (FCFA)'],
            'fournisseurs'=> ['Fournisseur', 'Téléphone', 'Total dû', 'Total payé', 'Solde dû'],
            default       => [],
        };
    }

    private function rows(string $type): array
    {
        return match($type) {
            'ca'          => $this->rowsCA(),
            'stock'       => $this->rowsStock(),
            'dettes'      => $this->rowsDettes(),
            'depenses'    => $this->rowsDepenses(),
            'consolide'   => $this->rowsConsolide(),
            'fournisseurs'=> $this->rowsFournisseurs(),
            default       => [],
        };
    }

    private function rowsCA(): array
    {
        $ca     = $this->data['ca']    ?? [];
        $couts  = $this->data['couts'] ?? [];
        $ventes = $this->data['ventes'] ?? [];
        $mode   = $ventes['par_mode'] ?? [];
        $encaisse    = $this->data['encaisse'] ?? [];
        $transferts  = $this->data['transferts_boutiques'] ?? [];

        $rows = [
            ['CA Brut',          $ca['brut']          ?? 0],
            ['Retours',          $ca['retours']        ?? 0],
            ['CA Net',           $ca['net']            ?? 0],
            ['Remises totales',  $ca['total_remises']  ?? 0],
            ['Écart prix',       $ca['ecart_prix']     ?? 0],
            ['---', '---'],
            ['Coût achats',      $couts['achat']       ?? 0],
            ['Marge brute',      $couts['marge_brute'] ?? 0],
            ['Dépenses',         $couts['depenses']    ?? 0],
            ['Bénéfice net',     $couts['benefice_net'] ?? 0],
            ['---', '---'],
            ['Ventes validées',  $ventes['count_validees']   ?? 0],
            ['Brouillons',       $ventes['count_brouillons'] ?? 0],
            ['Espèces',          $mode['especes']      ?? 0],
            ['Mobile Money',     $mode['mobile_money'] ?? 0],
            ['Avance client',  $mode['avance_client'] ?? 0],
            ['Crédit',           $mode['credit']       ?? 0],
        ];

        if (isset($ventes['sans_credit'])) {
            $rows = array_merge($rows, [
                ['---', '---'],
                ['Réglées intégralement',              $ventes['sans_credit']['montant']         ?? 0],
                ['Règlements partiels (réglé comptant)', $ventes['partielles']['montant_regle']    ?? 0],
                ['Règlements partiels (laissé à crédit)', $ventes['partielles']['montant_credit']  ?? 0],
                ['Entièrement à crédit',               $ventes['entierement_credit']['montant']   ?? 0],
            ]);
        }

        if (!empty($encaisse)) {
            $rows = array_merge($rows, [
                ['---', '---'],
                ['Réglé comptant sur ventes',  $encaisse['regle_sur_ventes'] ?? 0],
                ['Recouvrement de dettes',     $encaisse['recouvrement']    ?? 0],
                ['Avances déposées',           $encaisse['avances_deposees'] ?? 0],
                ['Total encaissé',             $encaisse['total']            ?? 0],
            ]);
        }

        if (!empty($transferts)) {
            $rows = array_merge($rows, [
                ['---', '---'],
                ['Transferts — dû par les boutiques (actuel)', $transferts['creances_actuelles']   ?? 0],
                ['Transferts — créés sur la période',           $transferts['crees_periode']        ?? 0],
                ['Transferts — encaissé sur la période',        $transferts['encaisse_periode']      ?? 0],
                ['Transferts — dont réglé via avance',          $transferts['regle_avance_periode']  ?? 0],
            ]);
        }

        return $rows;
    }

    private function rowsDetailVentes(): array
    {
        return collect($this->data['ventes']['detail'] ?? [])->map(fn($v) => [
            !empty($v['date_validation']) ? \Carbon\Carbon::parse($v['date_validation'])->format('d/m/Y') : '—',
            $v['numero_facture'] ?? '—',
            $v['client_nom']     ?? 'Anonyme',
            $v['total_net']      ?? 0,
            $v['reste_du']       ?? 0,
        ])->toArray();
    }

    private function rowsArticlesVendus(): array
    {
        return collect($this->data['ventes']['articles_vendus'] ?? [])->map(fn($a) => [
            !empty($a['date_validation']) ? \Carbon\Carbon::parse($a['date_validation'])->format('d/m/Y') : '—',
            $a['numero_facture'] ?? '—',
            $a['produit']        ?? '—',
            $a['quantite']       ?? 0,
            $a['prix_achat']     ?? 0,
            $a['prix_vente']     ?? 0,
            $a['prix_applique']  ?? 0,
            ($a['prix_applique'] ?? 0) - ($a['prix_achat'] ?? 0),
            $a['montant']        ?? 0,
        ])->toArray();
    }

    private function rowsStock(): array
    {
        return collect($this->data['variantes'] ?? [])->map(fn($v) => [
            $v['produit']      ?? '—',
            $v['reference']    ?? '—',
            $v['attributs']    ? implode(' / ', (array) $v['attributs']) : '—',
            $v['stock_actuel'] ?? 0,
            $v['seuil_alerte'] ?? 0,
            $v['valeur']       ?? 0,
            ($v['en_alerte'] ?? false) ? 'Alerte' : 'OK',
        ])->toArray();
    }

    private function rowsDettes(): array
    {
        $rows = collect($this->data['clients'] ?? [])->map(fn($c) => [
            trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')),
            $c['telephone']    ?? '—',
            $c['total_credit'] ?? 0,
            $c['total_paye']   ?? 0,
            $c['solde_dette']  ?? 0,
        ])->toArray();

        if (!empty($this->data['paiements_periode'])) {
            $rows[] = ['---', '---', '---', '---', '---'];
            $rows[] = ['Historique des paiements de la période', '', '', '', ''];
            foreach ($this->data['paiements_periode'] as $p) {
                $rows[] = [
                    trim(($p['prenom'] ?? '') . ' ' . ($p['nom'] ?? '')),
                    \Carbon\Carbon::parse($p['date'])->format('d/m/Y'),
                    $p['mode'] === 'especes' ? 'Espèces' : 'Mobile Money',
                    $p['source'] === 'vente' ? ($p['numero_facture'] ?? '—') : 'Dette antérieure',
                    $p['montant'] ?? 0,
                ];
            }
        }

        return $rows;
    }

    private function rowsFournisseurs(): array
    {
        $rows = collect($this->data['fournisseurs'] ?? [])->map(fn($f) => [
            $f['nom']         ?? '—',
            $f['telephone']   ?? '—',
            $f['total_du']    ?? 0,
            $f['total_paye']  ?? 0,
            $f['solde_dette'] ?? 0,
        ])->toArray();

        if (!empty($this->data['paiements_periode'])) {
            $rows[] = ['---', '---', '---', '---', '---'];
            $rows[] = ['Historique des paiements de la période', '', '', '', ''];
            foreach ($this->data['paiements_periode'] as $p) {
                $rows[] = [
                    $p['nom'] ?? '—',
                    \Carbon\Carbon::parse($p['date'])->format('d/m/Y'),
                    $p['numero_approvisionnement'] ?? '—',
                    '',
                    $p['montant'] ?? 0,
                ];
            }
        }

        return $rows;
    }

    private function rowsDepenses(): array
    {
        return collect($this->data['depenses'] ?? [])->map(fn($d) => [
            isset($d['date']) ? \Carbon\Carbon::parse($d['date'])->format('d/m/Y') : '—',
            $d['description'] ?? '—',
            $d['categorie']['libelle'] ?? 'Non catégorisé',
            $d['montant'] ?? 0,
        ])->toArray();
    }

    private function rowsConsolide(): array
    {
        return collect($this->data['boutiques'] ?? [])->map(fn($b) => [
            $b['nom']      ?? '—',
            $b['ca']       ?? 0,
            $b['benefice'] ?? 0,
            $b['depenses'] ?? 0,
            $b['dettes']   ?? 0,
            $b['stock']    ?? 0,
        ])->toArray();
    }
}