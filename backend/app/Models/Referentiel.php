<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referentiel extends Model
{
    protected $fillable = ['boutique_id', 'type', 'libelle', 'actif', 'ordre'];

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }
}