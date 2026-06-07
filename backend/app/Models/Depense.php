<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Depense extends Model
{
    protected $fillable = [
        'boutique_id', 'categorie_id', 'montant',
        'description', 'user_id', 'date',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'float',
            'date'    => 'date',
        ];
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'categorie_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}