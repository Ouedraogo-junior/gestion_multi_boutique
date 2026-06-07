import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDepenses, deleteDepense, type Depense } from '@/api/depenses'
import { getReferentiels, type Referentiel } from '@/api/referentiels'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import DepenseForm from './components/DepenseForm'
import DepenseFilters, { defaultFilters, type DepenseFilterValues } from './components/DepenseFilters'

export default function DepensesPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)

  const [depenses,    setDepenses]    = useState<Depense[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [categories,  setCategories]  = useState<Referentiel[]>([])
  const [filters,     setFilters]     = useState<DepenseFilterValues>(defaultFilters)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Depense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Depense | null>(null)

  // Charger catégories une seule fois
  useEffect(() => {
    getReferentiels(id, 'categorie_depense')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
        setCategories(data)
      })
      .catch(() => {})
  }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 50 }
      if (filters.categorie_id) params.categorie_id = filters.categorie_id
      if (filters.debut)        params.debut         = filters.debut
      if (filters.fin)          params.fin           = filters.fin

      const res  = await getDepenses(id, params)
      const data = res.data?.data ?? res.data
      const liste: Depense[] = Array.isArray(data) ? data : []
      setDepenses(liste)
      setTotal(res.data?.total ?? liste.length)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id, filters])

  const handleSaved = (depense: Depense) => {
    setDepenses(prev => {
      const idx = prev.findIndex(d => d.id === depense.id)
      if (idx >= 0) return prev.map(d => d.id === depense.id ? depense : d)
      return [depense, ...prev]
    })
    if (!editTarget) setTotal(t => t + 1)
    setEditTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteDepense(id, deleteTarget.id)
      setDepenses(prev => prev.filter(d => d.id !== deleteTarget.id))
      setTotal(t => t - 1)
      toast.success('Dépense supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalMontant = depenses.reduce((s, d) => s + Number(d.montant), 0)

  // Répartition par catégorie
  const parCategorie = categories
    .map(c => ({
      libelle: c.libelle,
      total: depenses
        .filter(d => d.categorie_id === c.id)
        .reduce((s, d) => s + Number(d.montant), 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Dépenses</h1>
          <p className="text-gray-500 text-sm mt-1">{total} dépense{total > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouvelle dépense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total des dépenses</p>
          <p className="text-3xl text-[#E8314A]">{formatMontant(totalMontant)}</p>
          <p className="text-xs text-gray-400 mt-2">{depenses.length} transaction{depenses.length > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-3">Répartition par catégorie</p>
          {parCategorie.length === 0 ? (
            <p className="text-sm text-gray-300">Aucune catégorie configurée</p>
          ) : (
            <div className="space-y-2">
              {parCategorie.map(c => (
                <div key={c.libelle} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{c.libelle}</span>
                  <span className="text-[#1C1C1C]">{formatMontant(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <DepenseFilters
        values={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : depenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune dépense</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Catégorie</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Enregistré par</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map(d => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-gray-400" />
                        {formatDate(d.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1C1C1C]">
                      {d.description ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {d.categorie ? (
                        <span className="inline-flex px-2 py-1 bg-[#F4F6F5] text-gray-500 rounded text-xs">
                          {d.categorie.libelle}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#E8314A] font-medium">
                      {formatMontant(d.montant)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {[d.user?.prenom, d.user?.nom].filter(Boolean).join(' ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditTarget(d); setFormOpen(true) }}
                          className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="text-gray-400 hover:text-[#E8314A] transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
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

      {/* Form */}
      <DepenseForm
        boutiqueId={id}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSaved={handleSaved}
        initial={editTarget}
      />

      {/* Dialog suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.description ?? 'Cette dépense'} — {deleteTarget ? formatMontant(deleteTarget.montant) : ''}.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#E8314A] hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}