<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VenteDetail extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'vente_id', 'variante_id', 'quantite',
        'prix_catalogue', 'prix_applique', 'remise_montant',
    ];

    protected function casts(): array
    {
        return [
            'prix_catalogue' => 'float',
            'prix_applique'  => 'float',
            'remise_montant' => 'float',
        ];
    }

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class);
    }
}