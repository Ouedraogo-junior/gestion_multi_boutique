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
        Schema::create('paiements_transferts_boutiques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_source_id')->constrained('boutiques')->cascadeOnDelete();
            $table->foreignId('transfert_boutique_id')->constrained('transferts_boutiques')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->decimal('montant', 15, 2);
            $table->enum('mode', ['especes', 'mobile_money'])->default('especes');
            $table->foreignId('operateur_id')->nullable()->constrained('referentiels')->nullOnDelete();
            $table->string('reference_paiement', 100)->nullable();
            $table->date('date_paiement');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_transferts_boutiques');
    }
};
