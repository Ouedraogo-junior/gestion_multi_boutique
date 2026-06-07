<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('vente_id')->constrained('ventes')->cascadeOnDelete();
            $table->decimal('montant', 15, 2);
            $table->enum('mode', ['especes', 'mobile_money']);
            $table->foreignId('operateur_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->text('note')->nullable();
            $table->date('date');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_clients');
    }
};