<?php

namespace App\Traits;

use App\Models\Variante;

trait PrixAchatTrait
{
    private function getPrixAchatVariante(Variante $variante): float
    {
        return $variante->prix_achat ?? $variante->produit?->prix_achat ?? 0;
    }
}
