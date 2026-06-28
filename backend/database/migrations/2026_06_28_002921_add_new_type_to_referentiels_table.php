<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE referentiels MODIFY COLUMN type ENUM(
            'categorie_produit',
            'attribut_variante',
            'categorie_depense',
            'operateur_mm',
            'motif_retour',
            'mode_paiement_fournisseur'
        ) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE referentiels MODIFY COLUMN type ENUM(
            'categorie_produit',
            'attribut_variante',
            'categorie_depense',
            'operateur_mm',
            'motif_retour'
        ) NOT NULL");
    }
};