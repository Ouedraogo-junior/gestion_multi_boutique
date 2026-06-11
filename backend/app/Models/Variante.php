<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Variante extends Model
{
    protected $fillable = [
        'produit_id', 'boutique_id', 'attributs', 'prix_vente',
        'stock_actuel', 'seuil_alerte', 'est_defaut', 'actif', 'prix_achat',
    ];

    protected function casts(): array
    {
        return [
            'attributs'   => 'array',
            'est_defaut'  => 'boolean',
            'actif'       => 'boolean',
            'prix_vente'  => 'float',
            'prix_achat'  => 'float',
        ];
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class);
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(MouvementStock::class, 'variante_id');
    }

    public function getEstEnAlerteAttribute(): bool
    {
        return $this->stock_actuel <= $this->seuil_alerte;
    }
}