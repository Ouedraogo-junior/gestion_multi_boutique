<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementClient extends Model
{
    public $timestamps = false;

    protected $table = 'paiements_clients';

    protected $fillable = [
        'boutique_id', 'client_id', 'vente_id', 'montant',
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

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class);
    }
}