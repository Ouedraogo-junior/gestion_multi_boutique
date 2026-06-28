<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Approvisionnement extends Model
{
    protected $fillable = [
        'boutique_id',
        'fournisseur_id',
        'user_id',
        'reference',
        'statut',
        'note',
        'montant_calcule',
        'montant_total_facture',
    ];

    protected $casts = [
        'montant_calcule'       => 'decimal:2',
        'montant_total_facture' => 'decimal:2',
    ];

    // ─── Accesseurs ───────────────────────────────────────────

    public function getMontantDuAttribute(): float
    {
        return (float) ($this->montant_total_facture ?? $this->montant_calcule);
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

    // ─── Relations ────────────────────────────────────────────

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(ApprovisionnementLigne::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementFournisseur::class);
    }

    // ─── Méthode statique existante (inchangée) ───────────────

    public static function genererReference(int $boutique_id): string
    {
        return DB::transaction(function () use ($boutique_id) {
            $count = self::where('boutique_id', $boutique_id)
                         ->lockForUpdate()
                         ->count();
            return 'APPRO-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        });
    }
}