<?php
namespace App\Http\Middleware;
use App\Models\Boutique;
use Closure;
use Illuminate\Http\Request;

class ScopeBoutique
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            $boutiqueId = $request->header('X-Boutique-ID')
                ?? $request->query('boutique_id')
                ?? $request->route('boutique_id');

            if ($boutiqueId) {
                // Valider que c'est un entier positif avant d'interroger la BD
                if (!is_numeric($boutiqueId) || (int) $boutiqueId <= 0) {
                    return response()->json([
                        'message' => 'Veuillez sélectionner une boutique valide.',
                        'code'    => 'BOUTIQUE_REQUIRED',
                    ], 400);
                }

                $boutique = Boutique::find((int) $boutiqueId);

                if (!$boutique) {
                    return response()->json([
                        'message' => 'Boutique introuvable. Veuillez en sélectionner une autre.',
                        'code'    => 'BOUTIQUE_NOT_FOUND',
                    ], 404);
                }

                app()->instance('boutique_active', $boutique);
            }
            // Pas de boutique_id → Super Admin sur route globale, on laisse passer

        } else {
            $boutique = Boutique::findOrFail($user->boutique_id);

            if (!$boutique->actif) {
                return response()->json(['message' => 'Boutique inactive'], 403);
            }

            $boutiqueIdUrl = $request->route('boutique_id');
            if ($boutiqueIdUrl && (int) $boutiqueIdUrl !== (int) $user->boutique_id) {
                return response()->json(['message' => 'Accès interdit'], 403);
            }

            app()->instance('boutique_active', $boutique);
        }

        return $next($request);
    }
}