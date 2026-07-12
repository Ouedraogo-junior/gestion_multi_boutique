<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vente extends Model
{
    protected $fillable = [
        'boutique_id', 'client_id', 'vendeur_id', 'statut',
        'numero_facture', 'total_brut', 'total_remise', 'total_net',
        'note', 'date_validation',
    ];

    protected function casts(): array
    {
        return [
            'date_validation' => 'datetime',
            'total_brut'      => 'float',
            'total_remise'    => 'float',
            'total_net'       => 'float',
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

    public function vendeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendeur_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(VenteDetail::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(VentePaiement::class);
    }

    public function paiementsClients(): HasMany
    {
        return $this->hasMany(PaiementClient::class);
    }

    public static function genererNumeroFacture(int $boutiqueId): string
    {
        $annee = now()->year;
        $count = self::where('boutique_id', $boutiqueId)
                     ->whereYear('created_at', $annee)
                     ->whereNotNull('numero_facture')
                     ->lockForUpdate()
                     ->count();
        return $annee . '-' . $boutiqueId . '-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
    }
}