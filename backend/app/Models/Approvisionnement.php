<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Approvisionnement extends Model
{
    protected $fillable = [
        'boutique_id', 'fournisseur_id', 'user_id', 'reference', 'note',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function boutique()
    {
        return $this->belongsTo(Boutique::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lignes()
    {
        return $this->hasMany(ApprovisionnementLigne::class);
    }

    public static function genererReference(int $boutique_id): string
    {
        $count = self::where('boutique_id', $boutique_id)->count() + 1;
        return 'APPRO-' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }
}