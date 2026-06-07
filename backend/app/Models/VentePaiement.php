<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VentePaiement extends Model
{
    public $timestamps = false;

    protected $fillable = ['vente_id', 'mode', 'operateur_id', 'montant'];

    protected function casts(): array
    {
        return ['montant' => 'float'];
    }

    public function operateur(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'operateur_id');
    }
}