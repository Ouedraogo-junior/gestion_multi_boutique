<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referentiels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->enum('type', [
                'categorie_produit',
                'attribut_variante',
                'categorie_depense',
                'operateur_mm',
                'motif_retour',
            ]);
            $table->string('libelle', 150);
            $table->boolean('actif')->default(true);
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referentiels');
    }
};