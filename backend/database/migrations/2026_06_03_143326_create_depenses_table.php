<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('categorie_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->decimal('montant', 15, 2);
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depenses');
    }
};