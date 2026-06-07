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
                $boutique = Boutique::findOrFail($boutiqueId);
                app()->instance('boutique_active', $boutique);
            }
        } else {
            $boutique = Boutique::findOrFail($user->boutique_id);

            if (!$boutique->actif) {
                return response()->json(['message' => 'Boutique inactive'], 403);
            }

            $boutiqueIdUrl = $request->route('boutique_id');
            if ($boutiqueIdUrl && (int)$boutiqueIdUrl !== (int)$user->boutique_id) {
                return response()->json(['message' => 'Accès interdit'], 403);
            }

            app()->instance('boutique_active', $boutique);
        }

        return $next($request);
    }
}