<?php
// app/Models/PaiementTransfertBoutique.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementTransfertBoutique extends Model
{
    protected $table = 'paiements_transferts_boutiques';
    public $timestamps = false;

    protected $fillable = [
        'boutique_source_id', 'transfert_boutique_id', 'user_id',
        'montant', 'mode', 'operateur_id', 'reference_paiement', 'date_paiement', 'note',
    ];

    protected $casts = [
        'montant'       => 'decimal:2',
        'date_paiement' => 'date',
        'created_at'    => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (PaiementTransfertBoutique $model) {
            $model->created_at = now();
        });
    }

    public function transfertBoutique(): BelongsTo
    {
        return $this->belongsTo(TransfertBoutique::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function operateur(): BelongsTo
    {
        return $this->belongsTo(Referentiel::class, 'operateur_id');
    }
}