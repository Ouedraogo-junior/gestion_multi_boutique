<?php

namespace App\Observers;

use App\Models\Produit;
use App\Models\Variante;

class ProduitObserver
{
    public function created(Produit $produit): void
    {
        if (!$produit->has_variantes) {
            Variante::create([
                'produit_id'   => $produit->id,
                'boutique_id'  => $produit->boutique_id,
                'attributs'    => null,
                'prix_vente'   => $produit->prix_vente,
                'stock_actuel' => 0,
                'seuil_alerte' => $produit->seuil_alerte,
                'est_defaut'   => true,
            ]);
        }
    }
}