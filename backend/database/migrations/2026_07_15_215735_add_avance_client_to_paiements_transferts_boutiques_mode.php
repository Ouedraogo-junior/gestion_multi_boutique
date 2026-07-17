<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE paiements_transferts_boutiques MODIFY mode ENUM('especes','mobile_money','avance_client') NOT NULL DEFAULT 'especes'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE paiements_transferts_boutiques MODIFY mode ENUM('especes','mobile_money') NOT NULL DEFAULT 'especes'");
    }
};