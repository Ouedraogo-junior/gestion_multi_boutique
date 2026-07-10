<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AvanceClient extends Model
{
    // Nom de table explicite : le nom par défaut deviné par Eloquent
    // ("avance_clients", pluriel appliqué au dernier mot) ne correspond pas
    // au nom réellement créé par la migration ("avances_clients").
    protected $table = 'avances_clients';

    public $timestamps = false; // uniquement created_at, comme mouvements_stock / paiements_clients

    protected $fillable = [
        'boutique_id', 'client_id', 'type', 'montant',
        'vente_id', 'mode_depot', 'operateur_id', 'user_id', 'note',
    ];

    protected function casts(): array
    {
        return [
            'montant'    => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}