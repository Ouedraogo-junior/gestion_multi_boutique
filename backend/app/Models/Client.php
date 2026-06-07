<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Client extends Model
{
    protected $fillable = ['boutique_id', 'nom', 'prenom', 'telephone', 'adresse', 'notes'];

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementClient::class);
    }

    public function scopeAvecDette(Builder $query): Builder
    {
        return $query->addSelect([
            'total_dette' => \DB::table(\DB::raw('(
                SELECT
                    v.client_id,
                    SUM(
                        (SELECT COALESCE(SUM(vp.montant), 0) FROM vente_paiements vp WHERE vp.vente_id = v.id AND vp.mode = "credit")
                        -
                        (SELECT COALESCE(SUM(pc.montant), 0) FROM paiements_clients pc WHERE pc.vente_id = v.id)
                    ) AS dette
                FROM ventes v
                WHERE v.statut = "validee"
                GROUP BY v.client_id
            ) as dettes_calc'))
                ->selectRaw('COALESCE(dette, 0)')
                ->whereColumn('dettes_calc.client_id', 'clients.id'),

            'total_achat' => \DB::table('ventes')
                ->selectRaw('COALESCE(SUM(total_net), 0)')
                ->whereColumn('client_id', 'clients.id')
                ->where('statut', 'validee'),

            'total_paye' => \DB::table('paiements_clients')
                ->selectRaw('COALESCE(SUM(montant), 0)')
                ->whereColumn('client_id', 'clients.id'),
        ]);
    }
}