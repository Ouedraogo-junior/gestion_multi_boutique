<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementFournisseur extends Model
{
    protected $table = 'paiements_fournisseurs';
    public $timestamps = false;

    protected $fillable = [
        'boutique_id',
        'approvisionnement_id',
        'user_id',
        'mode_paiement_id',
        'montant',
        'reference_paiement',
        'date_paiement',
        'note',
    ];

    protected $casts = [
        'montant'       => 'decimal:2',
        'date_paiement' => 'date',
        'created_at'    => 'datetime',
    ];

    protected static function booted(): void
    {
        // Insertion manuelle du created_at puisque timestamps = false
        static::creating(function (PaiementFournisseur $model) {
            $model->created_at = now();
        });
    }

    // ─── Relations ────────────────────────────────────────────

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function approvisionnement(): BelongsTo
    {
        return $this->belongsTo(Approvisionnement::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function modePaiement(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'mode_paiement_id');
    }
}