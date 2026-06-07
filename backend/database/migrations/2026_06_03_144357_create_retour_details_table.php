<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retour_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retour_id')->constrained('retours')->cascadeOnDelete();
            $table->foreignId('variante_id')->constrained('variantes');
            $table->integer('quantite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retour_details');
    }
};