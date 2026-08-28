<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Représente une seule feuille (onglet) d'un classeur Excel.
 * Utilisée par RapportExport pour produire plusieurs onglets (ex: Résumé,
 * Détail des ventes, Articles vendus) au sein d'un même fichier .xlsx.
 */
class RapportSheetExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function __construct(
        private string $sheetTitle,
        private array  $sheetHeadings,
        private array  $sheetRows,
    ) {}

    public function title(): string
    {
        // Excel limite les noms d'onglet à 31 caractères
        return mb_substr($this->sheetTitle, 0, 31);
    }

    public function headings(): array
    {
        return $this->sheetHeadings;
    }

    public function array(): array
    {
        return $this->sheetRows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FF1A7A4A']]],
        ];
    }
}