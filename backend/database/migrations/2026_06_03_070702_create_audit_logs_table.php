<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->nullable()->constrained('boutiques')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->string('user_pseudo', 50);
            $table->string('user_nom', 200);
            $table->string('action', 100);
            $table->string('module', 50);
            $table->json('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
            // Pas de updated_at : journal non modifiable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};