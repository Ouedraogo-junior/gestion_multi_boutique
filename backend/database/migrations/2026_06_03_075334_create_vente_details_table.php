<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vente_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vente_id')->constrained('ventes')->cascadeOnDelete();
            $table->foreignId('variante_id')->constrained('variantes');
            $table->integer('quantite');
            $table->decimal('prix_catalogue', 15, 2);
            $table->decimal('prix_applique', 15, 2);
            $table->decimal('remise_montant', 15, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vente_details');
    }
};