<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boutique_id')->nullable()->constrained('boutiques')->nullOnDelete();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('pseudo', 50)->unique();
            $table->string('password');
            $table->enum('role', ['super_admin', 'admin_boutique', 'vendeur']);
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};