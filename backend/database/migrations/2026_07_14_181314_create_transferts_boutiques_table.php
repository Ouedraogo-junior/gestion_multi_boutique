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
        Schema::create('transferts_boutiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_source_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('boutique_destination_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->string('reference', 50);
            $table->enum('statut', ['valide', 'annule'])->default('valide');
            $table->decimal('montant_calcule', 15, 2)->default(0);
            $table->decimal('montant_convenu', 15, 2)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['boutique_source_id', 'reference']);
            $table->index('boutique_destination_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transferts_boutiques');
    }
};
