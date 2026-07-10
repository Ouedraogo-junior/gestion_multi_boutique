<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements_clients', function (Blueprint $table) {
            $table->index(['boutique_id', 'client_id'], 'paiements_clients_boutique_client_index');
            $table->index(['boutique_id', 'vente_id'], 'paiements_clients_boutique_vente_index');
            $table->index(['boutique_id', 'date'], 'paiements_clients_boutique_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('paiements_clients', function (Blueprint $table) {
            $table->dropIndex('paiements_clients_boutique_client_index');
            $table->dropIndex('paiements_clients_boutique_vente_index');
            $table->dropIndex('paiements_clients_boutique_date_index');
        });
    }
};