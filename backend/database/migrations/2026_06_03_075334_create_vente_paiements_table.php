<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vente_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vente_id')->constrained('ventes')->cascadeOnDelete();
            $table->enum('mode', ['especes', 'mobile_money', 'credit']);
            $table->foreignId('operateur_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->decimal('montant', 15, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vente_paiements');
    }
};