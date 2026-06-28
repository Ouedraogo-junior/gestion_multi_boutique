<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements_fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')
                  ->constrained('boutiques')
                  ->cascadeOnDelete();
            $table->foreignId('approvisionnement_id')
                  ->constrained('approvisionnements')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->constrained('users');
            $table->foreignId('mode_paiement_id')
                  ->constrained('referentiels');
            $table->decimal('montant', 15, 2);
            $table->string('reference_paiement', 100)->nullable();
            $table->date('date_paiement');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements_fournisseurs');
    }
};