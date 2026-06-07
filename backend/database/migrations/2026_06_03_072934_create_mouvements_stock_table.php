<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements_stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('variante_id')->constrained('variantes')->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie', 'retour', 'ajustement']);
            $table->integer('quantite');
            $table->enum('source', ['vente', 'approvisionnement', 'retour', 'ajustement_manuel']);
            $table->unsignedBigInteger('source_id')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock');
    }
};