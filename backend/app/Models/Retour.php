<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Retour extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'boutique_id', 'vente_id', 'user_id', 'motif_id',
        'mode_remboursement', 'operateur_id', 'montant_rembourse',
        'note', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'montant_rembourse' => 'float',
            'created_at'        => 'datetime',
        ];
    }

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function motif(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'motif_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(RetourDetail::class);
    }
}