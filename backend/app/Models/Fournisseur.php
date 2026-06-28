<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fournisseur extends Model
{
    protected $fillable = [
        'boutique_id', 'nom', 'telephone', 'adresse', 'provenance', 'notes', 'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function boutique()
    {
        return $this->belongsTo(Boutique::class);
    }

    public function approvisionnements()
    {
        return $this->hasMany(Approvisionnement::class);
    }
}