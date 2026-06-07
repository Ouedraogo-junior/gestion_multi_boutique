<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetourDetail extends Model
{
    public $timestamps = false;

    protected $table = 'retour_details';

    protected $fillable = ['retour_id', 'variante_id', 'quantite'];

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class);
    }
}