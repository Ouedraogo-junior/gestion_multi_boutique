<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transfert_boutique_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfert_boutique_id')->constrained('transferts_boutiques')->cascadeOnDelete();
            $table->foreignId('variante_id')->constrained('variantes')->cascadeOnDelete();
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 15, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfert_boutique_lignes');
    }
};
