<?php
// app/Models/TransfertBoutiqueLigne.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransfertBoutiqueLigne extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'transfert_boutique_id', 'variante_id', 'quantite', 'prix_unitaire',
    ];

    public function transfertBoutique(): BelongsTo
    {
        return $this->belongsTo(TransfertBoutique::class);
    }

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class)->with('produit');
    }
}