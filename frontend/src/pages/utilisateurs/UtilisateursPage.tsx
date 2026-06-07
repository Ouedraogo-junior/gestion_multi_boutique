import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, Pencil, KeyRound, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUtilisateurs, toggleUtilisateur, type Utilisateur } from '@/api/utilisateurs'
import { toast } from 'sonner'
import UtilisateurForm from './components/UtilisateurForm'
import ResetPasswordDialog from './components/ResetPasswordDialog'
import { useAuth } from '@/hooks/useAuth'

export default function UtilisateursPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)
  const { user: currentUser } = useAuth()

  const [users, setUsers]               = useState<Utilisateur[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [formOpen, setFormOpen]         = useState(false)
  const [userEdit, setUserEdit]         = useState<Utilisateur | null>(null)
  const [userReset, setUserReset]       = useState<Utilisateur | null>(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 50 }
      if (q) params.search = q
      const res  = await getUtilisateurs(id, params)
      const data = res.data?.data ?? res.data
      const liste: Utilisateur[] = Array.isArray(data) ? data : []
      setUsers(liste)
      setTotal(res.data?.total ?? liste.length)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const handleToggle = async (u: Utilisateur) => {
    if (u.id === currentUser?.id) {
      toast.error('Impossible de modifier votre propre compte')
      return
    }
    try {
      await toggleUtilisateur(id, u.id)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, actif: !x.actif } : x))
      toast.success(u.actif ? 'Compte désactivé' : 'Compte activé')
    } catch {
      toast.error('Erreur')
    }
  }

  const handleSaved = (u: Utilisateur) => {
    setUsers(prev => {
      const existe = prev.findIndex(x => x.id === u.id)
      if (existe >= 0) return prev.map(x => x.id === u.id ? u : x)
      return [u, ...prev]
    })
    setTotal(prev => userEdit ? prev : prev + 1)
  }

  const admins  = users.filter(u => u.role === 'admin_boutique').length
  const vendeurs = users.filter(u => u.role === 'vendeur').length
  const inactifs = users.filter(u => !u.actif).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{total} utilisateur{total > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => { setUserEdit(null); setFormOpen(true) }}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Admins boutique</p>
          <p className="text-3xl text-[#1C1C1C]">{admins}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Vendeurs</p>
          <p className="text-3xl text-[#1C1C1C]">{vendeurs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Comptes inactifs</p>
          <p className="text-3xl text-[#E8314A]">{inactifs}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou pseudo..."
            className="pl-10 border-gray-200"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun utilisateur</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Pseudo</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-[#1C1C1C]">{u.prenom} {u.nom}</p>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{u.pseudo}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin_boutique' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                          <ShoppingBag size={12} /> Vendeur
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={u.id === currentUser?.id}
                        className="disabled:opacity-40 disabled:cursor-not-allowed"
                        title={u.id === currentUser?.id ? 'Votre propre compte' : u.actif ? 'Désactiver' : 'Activer'}
                      >
                        {u.actif ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#D4F0E2] text-[#145C38]">Actif</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-[#E8314A]">Inactif</span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setUserEdit(u); setFormOpen(true) }}
                          className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setUserReset(u)}
                          className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                          title="Réinitialiser mot de passe"
                        >
                          <KeyRound size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UtilisateurForm
        boutiqueId={id}
        open={formOpen}
        onClose={() => { setFormOpen(false); setUserEdit(null) }}
        onSaved={handleSaved}
        initial={userEdit}
      />

      <ResetPasswordDialog
        boutiqueId={id}
        user={userReset}
        onClose={() => setUserReset(null)}
      />
    </div>
  )
}