<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produit_id')->constrained('produits')->cascadeOnDelete();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->json('attributs')->nullable();
            $table->decimal('prix_vente', 15, 2)->nullable();
            $table->integer('stock_actuel')->default(0);
            $table->integer('seuil_alerte')->default(0);
            $table->boolean('est_defaut')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variantes');
    }
};