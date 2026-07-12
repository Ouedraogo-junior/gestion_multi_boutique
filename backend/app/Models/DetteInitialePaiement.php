<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetteInitialePaiement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'boutique_id', 'dette_initiale_id', 'client_id', 'montant',
        'mode', 'operateur_id', 'user_id', 'note', 'date', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'montant'    => 'float',
            'date'       => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function detteInitiale(): BelongsTo
    {
        return $this->belongsTo(DetteInitiale::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function operateur(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'operateur_id');
    }
}