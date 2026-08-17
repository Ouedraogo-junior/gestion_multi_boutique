<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE paiements_clients MODIFY mode ENUM('especes','mobile_money','avance_client','ajustement_retour') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE paiements_clients MODIFY mode ENUM('especes','mobile_money','avance_client') NOT NULL");
    }
};