<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boutiques', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 150);
            $table->string('adresse', 255)->nullable();
            $table->string('telephone', 30)->nullable();
            $table->string('logo', 255)->nullable();
            $table->string('slogan', 255)->nullable();
            $table->text('mention_legale')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boutiques');
    }
};