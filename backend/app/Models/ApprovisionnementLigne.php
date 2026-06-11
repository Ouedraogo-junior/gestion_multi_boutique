<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovisionnementLigne extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'approvisionnement_id', 'variante_id', 'quantite', 'prix_achat',
    ];

    public function approvisionnement()
    {
        return $this->belongsTo(Approvisionnement::class);
    }

    public function variante()
    {
        return $this->belongsTo(Variante::class)->with('produit');
    }
}