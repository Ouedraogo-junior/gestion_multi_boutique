<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvisionnements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('fournisseur_id')->constrained('fournisseurs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->string('reference', 50)->unique(); // REF générée auto
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('approvisionnement_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approvisionnement_id')->constrained('approvisionnements')->cascadeOnDelete();
            $table->foreignId('variante_id')->constrained('variantes')->cascadeOnDelete();
            $table->integer('quantite');
            $table->decimal('prix_achat', 15, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvisionnement_lignes');
        Schema::dropIfExists('approvisionnements');
    }
};