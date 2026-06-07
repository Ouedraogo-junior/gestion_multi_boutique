<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parametres_boutique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->string('cle', 100);
            $table->text('valeur')->nullable();
            $table->string('groupe', 100)->nullable();
            $table->timestamps();
            $table->unique(['boutique_id', 'cle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parametres_boutique');
    }
};