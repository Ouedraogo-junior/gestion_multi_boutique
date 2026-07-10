<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avances_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->enum('type', ['depot', 'utilisation']);
            $table->decimal('montant', 15, 2);
            $table->foreignId('vente_id')->nullable()->constrained('ventes')->nullOnDelete();
            $table->enum('mode_depot', ['especes', 'mobile_money'])->nullable();
            $table->foreignId('operateur_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['boutique_id', 'client_id']);
        });

        // Ajout du mode 'avance_client' sur vente_paiements
        DB::statement("ALTER TABLE vente_paiements MODIFY mode ENUM('especes','mobile_money','credit','avance_client') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE vente_paiements MODIFY mode ENUM('especes','mobile_money','credit') NOT NULL");
        Schema::dropIfExists('avances_clients');
    }
};