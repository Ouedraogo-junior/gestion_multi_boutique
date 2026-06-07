<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    // GET /boutiques/{boutique_id}/audit — Admin Boutique + Super Admin
    public function boutique(Request $request, int $boutique_id): JsonResponse
    {
        $query = AuditLog::where('boutique_id', $boutique_id)
                         ->orderByDesc('created_at');

        $this->appliquerFiltres($query, $request);

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    // GET /audit — Super Admin uniquement
    public function global(Request $request): JsonResponse
    {
        $query = AuditLog::orderByDesc('created_at');

        $this->appliquerFiltres($query, $request);

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    private function appliquerFiltres($query, Request $request): void
    {
        if ($request->has('module')) {
            $query->where('module', $request->module);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('user_pseudo')) {
            $query->where('user_pseudo', 'like', '%' . $request->user_pseudo . '%');
        }

        if ($request->has('debut')) {
            $query->whereDate('created_at', '>=', $request->debut);
        }

        if ($request->has('fin')) {
            $query->whereDate('created_at', '<=', $request->fin);
        }
    }
}