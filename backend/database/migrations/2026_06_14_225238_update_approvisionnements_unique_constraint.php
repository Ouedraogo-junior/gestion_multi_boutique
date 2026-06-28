<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approvisionnements', function (Blueprint $table) {
            $table->dropUnique('approvisionnements_reference_unique');
            $table->unique(['boutique_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::table('approvisionnements', function (Blueprint $table) {
            $table->dropUnique(['boutique_id', 'reference']);
            $table->unique('reference');
        });
    }
};