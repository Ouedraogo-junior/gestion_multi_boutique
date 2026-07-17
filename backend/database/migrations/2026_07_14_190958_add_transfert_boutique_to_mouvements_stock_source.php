<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE mouvements_stock MODIFY source ENUM('vente','approvisionnement','retour','ajustement_manuel','transfert_boutique') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE mouvements_stock MODIFY source ENUM('vente','approvisionnement','retour','ajustement_manuel') NOT NULL");
    }
};