<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'nom'         => 'Admin',
            'prenom'      => 'Super',
            'pseudo'      => 'superadmin',
            'password'    => 'admin1234',
            'role'        => 'super_admin',
            'boutique_id' => null,
            'actif'       => true,
        ]);
    }
}