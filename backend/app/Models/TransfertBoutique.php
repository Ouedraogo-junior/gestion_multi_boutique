<?php
// app/Models/TransfertBoutique.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class TransfertBoutique extends Model
{
    protected $table = 'transferts_boutiques';

    protected $fillable = [
        'boutique_source_id',
        'boutique_destination_id',
        'user_id',
        'reference',
        'statut',
        'note',
        'montant_calcule',
        'montant_convenu',
    ];

    protected $casts = [
        'montant_calcule' => 'decimal:2',
        'montant_convenu' => 'decimal:2',
    ];

    // ─── Accesseurs — même logique que Approvisionnement ──────

    public function getMontantDuAttribute(): float
    {
        return (float) ($this->montant_convenu ?? $this->montant_calcule);
    }

    public function getMontantPayeAttribute(): float
    {
        return (float) $this->paiements()->sum('montant');
    }

    public function getSoldeRestantAttribute(): float
    {
        return max(0, $this->montant_du - $this->montant_paye);
    }

    public function getStatutPaiementAttribute(): string
    {
        $paye = $this->montant_paye;
        $du   = $this->montant_du;

        if ($paye <= 0)   return 'non_paye';
        if ($paye >= $du) return 'solde';
        return 'partiel';
    }

    // ─── Relations ──────────────────────────────────────────────

    public function boutiqueSource(): BelongsTo
    {
        return $this->belongsTo(Boutique::class, 'boutique_source_id');
    }

    public function boutiqueDestination(): BelongsTo
    {
        return $this->belongsTo(Boutique::class, 'boutique_destination_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(TransfertBoutiqueLigne::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementTransfertBoutique::class);
    }

    // ─── Référence auto-générée, scope par boutique source ─────

    public static function genererReference(int $boutique_source_id): string
    {
        return DB::transaction(function () use ($boutique_source_id) {
            $count = self::where('boutique_source_id', $boutique_source_id)
                         ->lockForUpdate()
                         ->count();
            return 'TRF-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        });
    }
}