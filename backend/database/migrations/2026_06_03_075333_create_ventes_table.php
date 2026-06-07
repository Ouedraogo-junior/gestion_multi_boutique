<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('vendeur_id')->constrained('users');
            $table->enum('statut', ['brouillon', 'validee', 'annulee'])->default('brouillon');
            $table->string('numero_facture', 50)->nullable();
            $table->decimal('total_brut', 15, 2)->default(0);
            $table->decimal('total_remise', 15, 2)->default(0);
            $table->decimal('total_net', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventes');
    }
};