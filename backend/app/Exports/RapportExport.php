<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RapportExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function __construct(
        private string $type,
        private array  $data
    ) {}

    public function title(): string
    {
        return match($this->type) {
            'ca'        => 'Chiffre d\'affaires',
            'stock'     => 'Stock',
            'dettes'    => 'Dettes clients',
            'depenses'  => 'Dépenses',
            'consolide' => 'Consolidé',
            default     => 'Rapport',
        };
    }

    public function headings(): array
    {
        return match($this->type) {
            'ca'       => ['Indicateur', 'Valeur (FCFA)'],
            'stock'    => ['Produit', 'Référence', 'Attributs', 'Stock actuel', 'Seuil alerte', 'Valeur (FCFA)', 'Statut'],
            'dettes'   => ['Client', 'Téléphone', 'Total crédit', 'Total payé', 'Solde dû'],
            'depenses' => ['Date', 'Description', 'Catégorie', 'Montant (FCFA)'],
            'consolide'=> ['Boutique', 'CA (FCFA)', 'Bénéfice (FCFA)', 'Dépenses (FCFA)', 'Dettes (FCFA)', 'Stock (FCFA)'],
            default    => [],
        };
    }

    public function array(): array
    {
        return match($this->type) {
            'ca'       => $this->rowsCA(),
            'stock'    => $this->rowsStock(),
            'dettes'   => $this->rowsDettes(),
            'depenses' => $this->rowsDepenses(),
            'consolide'=> $this->rowsConsolide(),
            default    => [],
        };
    }

    private function rowsCA(): array
    {
        $ca     = $this->data['ca']    ?? [];
        $couts  = $this->data['couts'] ?? [];
        $ventes = $this->data['ventes'] ?? [];
        $mode   = $ventes['par_mode'] ?? [];

        return [
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
            ['Crédit',           $mode['credit']       ?? 0],
        ];
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
        return collect($this->data['clients'] ?? [])->map(fn($c) => [
            trim(($c['prenom'] ?? '') . ' ' . ($c['nom'] ?? '')),
            $c['telephone']    ?? '—',
            $c['total_credit'] ?? 0,
            $c['total_paye']   ?? 0,
            $c['solde_dette']  ?? 0,
        ])->toArray();
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

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FF1A7A4A']]],
        ];
    }
}