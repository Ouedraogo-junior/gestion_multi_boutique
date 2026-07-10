<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'pseudo'   => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('pseudo', $request->pseudo)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Audit échec connexion
            AuditLog::create([
                'boutique_id' => null,
                'user_id' => $user?->id,
                'user_pseudo' => $request->pseudo,
                'user_nom'    => $user ? $user->prenom . ' ' . $user->nom : 'inconnu',
                'action'      => 'echec_connexion',
                'module'      => 'auth',
                'details'     => ['ip' => $request->ip()],
                'ip_address'  => $request->ip(),
                'created_at'  => now(),
            ]);

            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Audit succès connexion
        AuditLog::create([
            'boutique_id' => $user->boutique_id,
            'user_id'     => $user->id,
            'user_pseudo' => $user->pseudo,
            'user_nom'    => $user->prenom . ' ' . $user->nom,
            'action'      => 'connexion',
            'module'      => 'auth',
            'details'     => ['ip' => $request->ip()],
            'ip_address'  => $request->ip(),
            'created_at'  => now(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'          => $user->id,
                'nom'         => $user->nom,
                'prenom'      => $user->prenom,
                'pseudo'      => $user->pseudo,
                'role'        => $user->role,
                'boutique_id' => $user->boutique_id,
                'boutique'    => $user->boutique_id ? $user->load('boutique')->boutique : null,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AuditLog::create([
            'boutique_id' => $user->boutique_id,
            'user_id'     => $user->id,
            'user_pseudo' => $user->pseudo,
            'user_nom'    => $user->prenom . ' ' . $user->nom,
            'action'      => 'deconnexion',
            'module'      => 'auth',
            'details'     => ['ip' => $request->ip()],
            'ip_address'  => $request->ip(),
            'created_at'  => now(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'          => $user->id,
            'nom'         => $user->nom,
            'prenom'      => $user->prenom,
            'pseudo'      => $user->pseudo,
            'role'        => $user->role,
            'boutique_id' => $user->boutique_id,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect'], 422);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Mot de passe modifié']);
    }
}