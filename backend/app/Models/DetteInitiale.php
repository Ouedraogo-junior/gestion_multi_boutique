<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DetteInitiale extends Model
{
    public $timestamps = false;
    protected $table = 'dettes_initiales';

    protected $fillable = [
        'boutique_id', 'client_id', 'montant', 'date', 'note', 'user_id', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'montant'    => 'float',
            'date'       => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(DetteInitialePaiement::class);
    }

    public function getSoldeRestantAttribute(): float
    {
        return (float) ($this->montant - $this->paiements()->sum('montant'));
    }
}