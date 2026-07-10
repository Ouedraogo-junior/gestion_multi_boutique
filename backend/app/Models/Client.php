<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

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

    public function avances(): HasMany
    {
        return $this->hasMany(AvanceClient::class);
    }

    public function scopeAvecDette(Builder $query, int $boutiqueId): Builder
    {
        $achatSub = DB::table('ventes')
            ->select('client_id')
            ->selectRaw('COALESCE(SUM(total_net), 0) as total_achat')
            ->where('statut', 'validee')
            ->where('boutique_id', $boutiqueId)
            ->groupBy('client_id');

        $payeClientSub = DB::table('paiements_clients')
            ->select('client_id')
            ->selectRaw('COALESCE(SUM(montant), 0) as total_paye')
            ->where('boutique_id', $boutiqueId)
            ->groupBy('client_id');

        // vente_paiements n'a pas de boutique_id : on filtre via un join sur ventes
        $creditParVenteSub = DB::table('vente_paiements as vp')
            ->join('ventes as v2', 'v2.id', '=', 'vp.vente_id')
            ->select('vp.vente_id')
            ->selectRaw('SUM(vp.montant) as montant_credit')
            ->where('vp.mode', 'credit')
            ->where('v2.boutique_id', $boutiqueId)
            ->groupBy('vp.vente_id');

        $payeParVenteSub = DB::table('paiements_clients')
            ->select('vente_id')
            ->selectRaw('SUM(montant) as montant_paye')
            ->where('boutique_id', $boutiqueId)
            ->groupBy('vente_id');

        $detteSub = DB::table('ventes as v')
            ->leftJoinSub($creditParVenteSub, 'credit', 'credit.vente_id', '=', 'v.id')
            ->leftJoinSub($payeParVenteSub, 'paye', 'paye.vente_id', '=', 'v.id')
            ->where('v.statut', 'validee')
            ->where('v.boutique_id', $boutiqueId)
            ->groupBy('v.client_id')
            ->select('v.client_id')
            ->selectRaw('COALESCE(SUM(COALESCE(credit.montant_credit, 0) - COALESCE(paye.montant_paye, 0)), 0) as total_dette');

        return $query
            ->leftJoinSub($achatSub, 'achat', 'achat.client_id', '=', 'clients.id')
            ->leftJoinSub($payeClientSub, 'paye_client', 'paye_client.client_id', '=', 'clients.id')
            ->leftJoinSub($detteSub, 'dette', 'dette.client_id', '=', 'clients.id')
            ->select('clients.*')
            ->selectRaw('COALESCE(achat.total_achat, 0) as total_achat')
            ->selectRaw('COALESCE(paye_client.total_paye, 0) as total_paye')
            ->selectRaw('COALESCE(dette.total_dette, 0) as total_dette');
    }

    public function getSoldeAvanceAttribute(): float
    {
        $depots      = $this->avances()->where('type', 'depot')->sum('montant');
        $utilisations = $this->avances()->where('type', 'utilisation')->sum('montant');
        return (float) ($depots - $utilisations);
    }
}