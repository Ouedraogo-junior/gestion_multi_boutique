<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParametreBoutique extends Model
{
    protected $table = 'parametres_boutique';

    protected $fillable = ['boutique_id', 'cle', 'valeur', 'groupe'];

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }
}