<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = auth()->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        return $next($request);
    }
}