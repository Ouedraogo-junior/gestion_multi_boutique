<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('vente_id')->constrained('ventes');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('motif_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->enum('mode_remboursement', ['especes', 'avoir', 'mobile_money']);
            $table->foreignId('operateur_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->decimal('montant_rembourse', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retours');
    }
};