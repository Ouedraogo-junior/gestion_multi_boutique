<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('avances_clients', function (Blueprint $table) {
            $table->foreignId('transfert_boutique_id')->nullable()->after('vente_id')
                  ->constrained('transferts_boutiques')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('avances_clients', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transfert_boutique_id');
        });
    }
};