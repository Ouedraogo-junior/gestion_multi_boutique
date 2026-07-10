import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getVentes, annulerVente } from '@/api/ventes'
import type { Vente } from '@/api/ventes'
import { formatMontant, formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

const STATUT_LABELS: Record<string, { label: string; className: string }> = {
  brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  validee:   { label: 'Validée',   className: 'bg-[#D4F0E2] text-[#145C38]' },
  annulee:   { label: 'Annulée',   className: 'bg-red-50 text-[#E8314A]' },
}

export default function VentesPage() {
  const { boutiqueId } = useParams()
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const id              = Number(boutiqueId)

  const [ventes, setVentes]           = useState<Vente[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [annulerTarget, setAnnulerTarget] = useState<Vente | null>(null)
  const [page, setPage]               = useState(1)
  const [lastPage, setLastPage]       = useState(1)

  const isAdmin = user?.role === ROLES.ADMIN_BOUTIQUE || user?.role === ROLES.SUPER_ADMIN

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 25, page }
      if (filtreStatut !== 'tous') params.statut = filtreStatut
      const res  = await getVentes(id, params)
      const data = res.data?.data ?? res.data
      setVentes(Array.isArray(data) ? data : [])
      setTotal(res.data?.total ?? (Array.isArray(data) ? data.length : 0))
      setLastPage(res.data?.last_page ?? 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id, filtreStatut, page])

  const handleAnnuler = async () => {
    if (!annulerTarget) return
    try {
      await annulerVente(id, annulerTarget.id)
      toast.success('Vente annulée')
      setAnnulerTarget(null)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'annulation')
    }
  }

    // Helpers à ajouter en haut du fichier
    const getResteAPayer = (v: Vente) => {
    const credit = v.paiements?.filter(p => p.mode === 'credit').reduce((s, p) => s + Number(p.montant), 0) ?? 0
    return credit
    }

    const MODE_LABELS: Record<string, string> = {
      especes:       'Espèces',
      mobile_money:  'Mobile Money',
      avance_client: 'Avance client',
      credit:        'Crédit',
    }

    const getModePaiement = (v: Vente) => {
      const modes = Array.from(new Set(v.paiements?.map(p => p.mode) ?? []))
      if (modes.length === 0) return '—'
      return modes.map(m => MODE_LABELS[m] ?? m).join(' + ')
    }

    const getStatutPaiement = (v: Vente) => {
    if (v.statut !== 'validee') return null
    const reste = getResteAPayer(v)
    return reste > 0
        ? { label: 'Dette', className: 'bg-red-50 text-[#E8314A]' }
        : { label: 'Réglé', className: 'bg-[#D4F0E2] text-[#145C38]' }
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Ventes</h1>
          <p className="text-gray-500 text-sm mt-1">{total} vente{total > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => navigate(`/boutiques/${id}/ventes/nouvelle`)}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouvelle vente
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">Statut :</span>
          <div className="flex gap-2">
            {['tous', 'brouillon', 'validee', 'annulee'].map(s => (
              <button
                key={s}
                onClick={() => { setFiltreStatut(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filtreStatut === s
                    ? 'bg-[#1A7A4A] text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'tous' ? 'Toutes' : STATUT_LABELS[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : ventes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune vente</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">N° Facture</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Client</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total net</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Règlement</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Reste dû</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ventes.map(v => {
                  const statut = STATUT_LABELS[v.statut]
                  return (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/boutiques/${id}/ventes/${v.id}`)}
                      className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {v.numero_facture ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(v.date_validation ?? v.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {v.client ? [v.client.prenom, v.client.nom].filter(Boolean).join(' ') : <span className="text-gray-300">Client</span>}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatMontant(v.total_net)}
                      </td>

                      {/* Mode de règlement */}
                        <td className="py-3 px-4 text-sm text-gray-600">
                            {v.statut === 'validee' ? getModePaiement(v) : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Reste à payer */}
                        <td className="py-3 px-4 text-sm">
                        {v.statut === 'validee' && getResteAPayer(v) > 0
                            ? <span className="text-[#E8314A] font-medium">{formatMontant(getResteAPayer(v))}</span>
                            : <span className="text-gray-300">—</span>
                        }
                        </td>

                        {/* Statut vente + paiement */}
                        <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${statut?.className}`}>
                            {statut?.label}
                            </span>
                            {(() => {
                            const sp = getStatutPaiement(v)
                            return sp ? (
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${sp.className}`}>
                                {sp.label}
                                </span>
                            ) : null
                            })()}
                        </div>
                        </td>

                      {/* <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statut?.className}`}>
                          {statut?.label}
                        </span>
                      </td> */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/boutiques/${id}/ventes/${v.id}`) }}
                            className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                            title="Voir détail"
                          >
                            <Eye size={17} />
                          </button>

                          {v.statut === 'brouillon' && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/boutiques/${id}/ventes/${v.id}/continuer`) }}
                              className="text-xs text-gray-400 hover:text-[#1A7A4A] transition-colors border border-gray-200 px-2 py-0.5 rounded"
                            >
                              Continuer
                            </button>
                          )}
                          {isAdmin && v.statut === 'validee' && (
                            <button
                              onClick={e => { e.stopPropagation(); setAnnulerTarget(v) }}
                              className="text-xs text-gray-400 hover:text-[#E8314A] transition-colors border border-gray-200 px-2 py-0.5 rounded"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {lastPage} — {total} vente{total > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} className="mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                >
                  Suivant
                  <ChevronRight size={15} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialog annulation */}
      <AlertDialog open={!!annulerTarget} onOpenChange={open => !open && setAnnulerTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              La vente {annulerTarget?.numero_facture} sera annulée et le stock réintégré. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnnuler}
              className="bg-[#E8314A] hover:bg-red-700 text-white"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}