// src/pages/fournisseurs/FournisseursPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Wallet, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getFournisseurs, updateFournisseur } from '@/api/approvisionnements'
import type { Fournisseur } from '@/api/approvisionnements'
import { toast } from 'sonner'
import FournisseurForm from './components/FournisseurForm'

export default function FournisseursPage() {
  const { boutiqueId } = useParams()
  const navigate        = useNavigate()
  const id               = Number(boutiqueId)

  const [fournisseurs, setFournisseurs]     = useState<Fournisseur[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [formOpen, setFormOpen]             = useState(false)
  const [fournisseurEdit, setFournisseurEdit] = useState<Fournisseur | null>(null)

  const charger = async () => {
    setLoading(true)
    try {
      const params = search ? { search } : undefined
      const res = await getFournisseurs(id, params)
      setFournisseurs(res.data)
    } catch {
      toast.error('Erreur lors du chargement des fournisseurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(charger, 300) // debounce recherche
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search])

  const ouvrirCreation = () => {
    setFournisseurEdit(null)
    setFormOpen(true)
  }

  const ouvrirEdition = (f: Fournisseur) => {
    setFournisseurEdit(f)
    setFormOpen(true)
  }

  const handleSaved = (f: Fournisseur) => {
    setFournisseurs(prev => {
      const existe = prev.some(x => x.id === f.id)
      return existe ? prev.map(x => (x.id === f.id ? f : x)) : [f, ...prev]
    })
  }

  const desactiver = async (f: Fournisseur) => {
    if (!confirm(`Désactiver le fournisseur "${f.nom}" ? Il n'apparaîtra plus dans les listes actives.`)) return
    try {
      await updateFournisseur(id, f.id, { actif: false })
      toast.success('Fournisseur désactivé')
      setFournisseurs(prev => prev.filter(x => x.id !== f.id))
    } catch {
      toast.error('Erreur lors de la désactivation')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Fournisseurs</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les informations de vos fournisseurs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/boutiques/${id}/dettes-fournisseurs`)}
            className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2"
          >
            <Wallet size={16} /> Dettes fournisseurs
          </Button>
          <Button onClick={ouvrirCreation} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white gap-2">
            <Plus size={16} /> Nouveau fournisseur
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur..."
          className="pl-9 border-gray-200"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : fournisseurs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun fournisseur trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Nom</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Provenance</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Adresse</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fournisseurs.map(f => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">{f.nom}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{f.telephone ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{f.provenance ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{f.adresse ?? '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => ouvrirEdition(f)}
                          title="Modifier"
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1A7A4A] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => desactiver(f)}
                          title="Désactiver"
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-[#E8314A] transition-colors"
                        >
                          <Power size={16} />
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

      <FournisseurForm
        boutiqueId={id}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        initial={fournisseurEdit}
      />
    </div>
  )
}