<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE boutiques MODIFY telephone VARCHAR(150) NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE boutiques MODIFY telephone VARCHAR(30) NULL");
    }
};