<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BoutiqueController;
use App\Http\Controllers\Api\ReferentielController;
use App\Http\Controllers\Api\ParametreController;
use App\Http\Controllers\Api\ProduitController;
use App\Http\Controllers\Api\VenteController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DepenseController;
use App\Http\Controllers\Api\RetourController;
use App\Http\Controllers\Api\RapportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\ApprovisionnementController;

// Auth publique
Route::post('/auth/login', [AuthController::class, 'login']);

// Auth protégée
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',        [AuthController::class, 'logout']);
    Route::get('/auth/me',             [AuthController::class, 'me']);
    Route::put('/auth/password',       [AuthController::class, 'changePassword']);
});

Route::middleware(['auth:sanctum', 'scope.boutique', 'audit'])->group(function () {

    // Boutiques — Super Admin uniquement
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/boutiques',                        [BoutiqueController::class, 'index']);
        Route::post('/boutiques',                       [BoutiqueController::class, 'store']);
        Route::get('/boutiques/{id}',                   [BoutiqueController::class, 'show']);
        Route::put('/boutiques/{id}',                   [BoutiqueController::class, 'update']);
        Route::patch('/boutiques/{id}/toggle-actif',    [BoutiqueController::class, 'toggleActif']);

        // Audit global
        Route::get('/audit', [AuditController::class, 'global']);
    });

    // Référentiels & Paramètres — Admin + Super Admin
    Route::middleware('role:admin_boutique,super_admin')->group(function () {

        // Boutique
        Route::put('/boutiques/{id}',                   [BoutiqueController::class, 'update']);

        // Référentiels
        Route::get('/boutiques/{boutique_id}/referentiels',       [ReferentielController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/referentiels',      [ReferentielController::class, 'store']);
        Route::put('/boutiques/{boutique_id}/referentiels/{id}',  [ReferentielController::class, 'update']);
        Route::delete('/boutiques/{boutique_id}/referentiels/{id}', [ReferentielController::class, 'destroy']);

        // Paramètres
        Route::get('/boutiques/{boutique_id}/parametres',         [ParametreController::class, 'index']);
        Route::put('/boutiques/{boutique_id}/parametres',         [ParametreController::class, 'upsert']);

        // Ventes
        Route::post('/boutiques/{boutique_id}/ventes/{id}/annuler',[VenteController::class, 'annuler']);

        // Depenses
        Route::get('/boutiques/{boutique_id}/depenses',        [DepenseController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/depenses',       [DepenseController::class, 'store']);
        Route::put('/boutiques/{boutique_id}/depenses/{id}',   [DepenseController::class, 'update']);
        Route::delete('/boutiques/{boutique_id}/depenses/{id}',[DepenseController::class, 'destroy']);

        // Rapports
        Route::get('/boutiques/{boutique_id}/rapports/ca',       [RapportController::class, 'ca']);
        Route::get('/boutiques/{boutique_id}/rapports/stock',    [RapportController::class, 'stock']);
        Route::get('/boutiques/{boutique_id}/rapports/dettes',   [RapportController::class, 'dettes']);
        Route::get('/boutiques/{boutique_id}/rapports/depenses', [RapportController::class, 'depenses']);
        Route::get('/boutiques/{boutique_id}/rapports/export',   [RapportController::class, 'export']);
        Route::get('/rapports/consolide/export',                 [RapportController::class, 'exportConsolide']);

        // Audit
        Route::get('/boutiques/{boutique_id}/audit', [AuditController::class, 'boutique']);
    });

    // Produits & Stock — Admin + Vendeur
    Route::middleware('role:admin_boutique,super_admin,vendeur')->group(function () {
        
        Route::get('/boutiques/{id}', [BoutiqueController::class, 'show']);

        Route::get('/boutiques/{boutique_id}/produits',                         [ProduitController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/produits',                        [ProduitController::class, 'store']);
        Route::get('/boutiques/{boutique_id}/produits/{id}',                    [ProduitController::class, 'show']);
        Route::put('/boutiques/{boutique_id}/produits/{id}',                    [ProduitController::class, 'update']);
        Route::patch('/boutiques/{boutique_id}/produits/{id}/toggle-actif',     [ProduitController::class, 'toggleActif']);
        Route::post('/boutiques/{boutique_id}/produits/{id}/variantes',         [ProduitController::class, 'storeVariante']);
        Route::delete('/boutiques/{boutique_id}/produits/{id}',                 [ProduitController::class, 'destroy']);
        Route::put('/boutiques/{boutique_id}/variantes/{id}',                   [ProduitController::class, 'updateVariante']);
        Route::delete('/boutiques/{boutique_id}/variantes/{id}',                [ProduitController::class, 'destroyVariante']);
        Route::post('/boutiques/{boutique_id}/stock/entree',                    [ProduitController::class, 'entreeStock']);
        Route::get('/boutiques/{boutique_id}/stock/mouvements',                 [ProduitController::class, 'mouvements']);
        Route::get('/boutiques/{boutique_id}/stock/alertes',                    [ProduitController::class, 'alertes']);

        Route::get('/boutiques/{boutique_id}/clients/{id}/paiements', [ClientController::class, 'paiements']);

        // Ventes
        Route::get('/boutiques/{boutique_id}/ventes',              [VenteController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/ventes',             [VenteController::class, 'store']);
        Route::get('/boutiques/{boutique_id}/ventes/{id}',         [VenteController::class, 'show']);
        Route::put('/boutiques/{boutique_id}/ventes/{id}',         [VenteController::class, 'update']);
        Route::post('/boutiques/{boutique_id}/ventes/{id}/valider',[VenteController::class, 'valider']);

        // Clients
        Route::get('/boutiques/{boutique_id}/clients',                        [ClientController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/clients',                       [ClientController::class, 'store']);
        Route::get('/boutiques/{boutique_id}/clients/{id}',                   [ClientController::class, 'show']);
        Route::put('/boutiques/{boutique_id}/clients/{id}',                   [ClientController::class, 'update']);
        Route::get('/boutiques/{boutique_id}/clients/{id}/dettes',            [ClientController::class, 'dettes']);
        Route::post('/boutiques/{boutique_id}/clients/{id}/paiements',        [ClientController::class, 'storePaiement']);

        // Retours
        Route::get('/boutiques/{boutique_id}/retours',      [RetourController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/retours',     [RetourController::class, 'store']);
        Route::get('/boutiques/{boutique_id}/retours/{id}', [RetourController::class, 'show']);

        // Tableau de bord 
        Route::get('/boutiques/{boutique_id}/dashboard', [DashboardController::class, 'boutique']);

        // Fournisseurs
        Route::get('/boutiques/{boutique_id}/fournisseurs', [FournisseurController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/fournisseurs', [FournisseurController::class, 'store']);
        Route::put('/boutiques/{boutique_id}/fournisseurs/{id}', [FournisseurController::class, 'update']);

        // Approvisionnements
        Route::get('/boutiques/{boutique_id}/approvisionnements', [ApprovisionnementController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/approvisionnements', [ApprovisionnementController::class, 'store']);
        Route::get('/boutiques/{boutique_id}/approvisionnements/{id}', [ApprovisionnementController::class, 'show']);

        // Utilisateurs
        Route::get('/boutiques/{boutique_id}/users',                    [UserController::class, 'index']);
        Route::post('/boutiques/{boutique_id}/users',                   [UserController::class, 'store']);
        Route::put('/boutiques/{boutique_id}/users/{id}',               [UserController::class, 'update']);
        Route::patch('/boutiques/{boutique_id}/users/{id}/toggle-actif',[UserController::class, 'toggleActif']);
        Route::post('/boutiques/{boutique_id}/users/{id}/reset-password',[UserController::class, 'resetPassword']);

    });

    // Consolidé Super Admin
    Route::middleware('role:super_admin')->group(function () {
        // Rapport consolidé
        Route::get('/rapports/consolide', [RapportController::class, 'consolide']);

        // Dashboard global
        Route::get('/dashboard', [DashboardController::class, 'global']);

    });

});

