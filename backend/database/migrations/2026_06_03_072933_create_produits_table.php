<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->string('reference', 50);
            $table->string('designation', 200);
            $table->foreignId('categorie_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->string('photo', 255)->nullable();
            $table->decimal('prix_achat', 15, 2)->default(0);
            $table->decimal('prix_vente', 15, 2);
            $table->text('description')->nullable();
            $table->enum('etat', ['neuf', 'occasion'])->default('neuf');
            $table->string('fournisseur_nom', 150)->nullable();
            $table->string('fournisseur_contact', 100)->nullable();
            $table->string('fournisseur_telephone', 30)->nullable();
            $table->text('fournisseur_notes')->nullable();
            $table->integer('seuil_alerte')->default(0);
            $table->boolean('has_variantes')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->unique(['boutique_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};