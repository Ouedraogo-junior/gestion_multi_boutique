<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approvisionnements', function (Blueprint $table) {
            $table->enum('statut', ['brouillon', 'valide'])
                  ->default('brouillon')
                  ->after('user_id');
            $table->decimal('montant_calcule', 15, 2)
                  ->default(0)
                  ->after('note');
            $table->decimal('montant_total_facture', 15, 2)
                  ->nullable()
                  ->after('montant_calcule');
        });
    }

    public function down(): void
    {
        Schema::table('approvisionnements', function (Blueprint $table) {
            $table->dropColumn(['statut', 'montant_calcule', 'montant_total_facture']);
        });
    }
};