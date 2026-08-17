<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE ventes ADD COLUMN client_nom_libre VARCHAR(150) NULL AFTER client_id");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE ventes DROP COLUMN client_nom_libre");
    }
};