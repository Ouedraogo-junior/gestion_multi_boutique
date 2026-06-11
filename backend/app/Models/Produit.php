<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produit extends Model
{
    protected $fillable = [
        'boutique_id', 'reference', 'designation', 'categorie_id',
        'photo', 'prix_achat', 'prix_vente', 'description', 'etat',
        'fournisseur_nom', 'fournisseur_contact', 'fournisseur_telephone',
        'fournisseur_notes', 'seuil_alerte', 'has_variantes', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'has_variantes' => 'boolean',
            'actif'         => 'boolean',
            'prix_achat'    => 'float',
            'prix_vente'    => 'float',
        ];
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'categorie_id');
    }

    public function variantes(): HasMany
    {
        return $this->hasMany(Variante::class);
    }

    public function varianteDefaut(): HasMany
    {
        return $this->hasMany(Variante::class)->where('est_defaut', true);
    }

    public static function genererReference(int $boutiqueId): string
    {
        $prefixe = 'PROD-' . $boutiqueId . '-' . now()->format('Ym') . '-';

        $dernier = self::where('boutique_id', $boutiqueId)
                    ->where('reference', 'like', $prefixe . '%')
                    ->lockForUpdate()
                    ->max('reference');

        $sequence = $dernier
            ? (int) substr($dernier, strrpos($dernier, '-') + 1)
            : 0;

        return $prefixe . str_pad($sequence + 1, 4, '0', STR_PAD_LEFT);
    }
}