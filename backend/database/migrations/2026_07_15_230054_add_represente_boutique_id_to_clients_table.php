<?php
// database/migrations/xxxx_add_represente_boutique_id_to_clients_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE clients ADD COLUMN represente_boutique_id BIGINT UNSIGNED NULL AFTER est_boutique");
        DB::statement("ALTER TABLE clients ADD CONSTRAINT fk_client_represente_boutique FOREIGN KEY (represente_boutique_id) REFERENCES boutiques(id) ON DELETE SET NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE clients DROP FOREIGN KEY fk_client_represente_boutique");
        DB::statement("ALTER TABLE clients DROP COLUMN represente_boutique_id");
    }
};