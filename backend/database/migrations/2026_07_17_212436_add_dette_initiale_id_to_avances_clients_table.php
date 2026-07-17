<?php
// database/migrations/xxxx_add_dette_initiale_id_to_avances_clients_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('avances_clients', function (Blueprint $table) {
            $table->foreignId('dette_initiale_id')->nullable()->after('transfert_boutique_id')
                  ->constrained('dettes_initiales')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('avances_clients', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dette_initiale_id');
        });
    }
};