<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->index(['statut', 'client_id'], 'ventes_statut_client_index');
            $table->index(['boutique_id', 'statut'], 'ventes_boutique_statut_index');
        });

        Schema::table('vente_paiements', function (Blueprint $table) {
            $table->index(['mode', 'vente_id'], 'vente_paiements_mode_vente_index');
        });
    }

    public function down(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->dropIndex('ventes_statut_client_index');
            $table->dropIndex('ventes_boutique_statut_index');
        });
        Schema::table('vente_paiements', function (Blueprint $table) {
            $table->dropIndex('vente_paiements_mode_vente_index');
        });
    }
};