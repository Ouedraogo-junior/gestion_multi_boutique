<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE clients ADD COLUMN est_boutique BOOLEAN NOT NULL DEFAULT FALSE AFTER notes");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE clients DROP COLUMN est_boutique");
    }
};