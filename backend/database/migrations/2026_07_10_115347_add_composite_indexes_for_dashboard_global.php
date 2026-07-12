<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            // On n'essaie plus de supprimer l'ancien index (il supporte la FK boutique_id)
            // On ajoute simplement le composite qui couvre aussi date_validation
            $table->index(['boutique_id', 'statut', 'date_validation'], 'ventes_boutique_statut_date_index');
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->index(['boutique_id', 'date'], 'depenses_boutique_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->dropIndex('ventes_boutique_statut_date_index');
        });

        Schema::table('depenses', function (Blueprint $table) {
            $table->dropIndex('depenses_boutique_date_index');
        });
    }
};