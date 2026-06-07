<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request, int $boutique_id): JsonResponse
    {
        $query = User::where('boutique_id', $boutique_id)
                     ->orderBy('nom');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('prenom', 'like', '%' . $request->search . '%')
                  ->orWhere('pseudo', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request, int $boutique_id): JsonResponse
    {
        $data = $request->validate([
            'nom'    => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'pseudo' => 'required|string|max:50|unique:users,pseudo',
            'role'   => ['required', Rule::in(['admin_boutique', 'vendeur'])],
            'password' => 'required|string|min:6',
        ]);

        $data['boutique_id'] = $boutique_id;
        $data['actif']       = true;

        $user = User::create($data);

        $request->auditAction  = 'user_cree';
        $request->auditModule  = 'utilisateurs';
        $request->auditDetails = ['apres' => array_diff_key($user->toArray(), ['password' => ''])];

        return response()->json($user->makeHidden('password'), 201);
    }

    public function update(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $user = User::where('boutique_id', $boutique_id)->findOrFail($id);
        $avant = $user->toArray();

        $data = $request->validate([
            'nom'    => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'pseudo' => ['sometimes', 'string', 'max:50', Rule::unique('users', 'pseudo')->ignore($id)],
            'role'   => ['sometimes', Rule::in(['admin_boutique', 'vendeur'])],
        ]);

        $user->update($data);

        $request->auditAction  = 'user_modifie';
        $request->auditModule  = 'utilisateurs';
        $request->auditDetails = ['avant' => $avant, 'apres' => $user->fresh()->toArray()];

        return response()->json($user->fresh()->makeHidden('password'));
    }

    public function toggleActif(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $user = User::where('boutique_id', $boutique_id)->findOrFail($id);

        // Empêcher de se désactiver soi-même
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Impossible de modifier votre propre compte'], 422);
        }

        $user->update(['actif' => !$user->actif]);

        $request->auditAction  = 'user_desactive';
        $request->auditModule  = 'utilisateurs';
        $request->auditDetails = ['user_id' => $id, 'actif' => $user->actif];

        return response()->json(['actif' => $user->actif]);
    }

    public function resetPassword(Request $request, int $boutique_id, int $id): JsonResponse
    {
        $user = User::where('boutique_id', $boutique_id)->findOrFail($id);

        $data = $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user->update(['password' => $data['password']]);

        $request->auditAction  = 'user_modifie';
        $request->auditModule  = 'utilisateurs';
        $request->auditDetails = ['user_id' => $id, 'action' => 'reset_password'];

        return response()->json(['message' => 'Mot de passe réinitialisé']);
    }
}