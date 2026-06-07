<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MouvementStock extends Model
{
    public $timestamps = false;

    protected $table = 'mouvements_stock';

    protected $fillable = [
        'boutique_id', 'variante_id', 'type', 'quantite',
        'source', 'source_id', 'user_id', 'note', 'created_at',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}