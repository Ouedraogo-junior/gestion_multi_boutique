<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogger
{
    public function handle(Request $request, Closure $next): mixed
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) return;
        if (!auth()->check()) return;
        if ($response->getStatusCode() >= 400) return;

        $user    = auth()->user();
        $boutique = app()->bound('boutique_active') ? app('boutique_active') : null;

        AuditLog::create([
            'boutique_id' => $boutique?->id,
            'user_id'     => $user->id,
            'user_pseudo' => $user->pseudo,
            'user_nom'    => $user->prenom . ' ' . $user->nom,
            'action'      => $request->auditAction ?? $request->method() . ':' . $request->path(),
            'module'      => $request->auditModule ?? 'general',
            'details'     => $request->auditDetails ?? null,
            'ip_address'  => $request->ip(),
            'created_at'  => now(),
        ]);
    }
}