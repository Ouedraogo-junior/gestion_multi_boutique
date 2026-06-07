import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRetours, type Retour } from '@/api/retours'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import RetourForm from './components/RetourForm'

const MODE_LABELS: Record<string, string> = {
  especes:      'Espèces',
  avoir:        'Avoir',
  mobile_money: 'Mobile Money',
}

export default function RetoursPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)

  const [retours,   setRetours]   = useState<Retour[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [formOpen,  setFormOpen]  = useState(false)
  const [expanded,  setExpanded]  = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await getRetours(id, { per_page: 50 })
      const data = res.data?.data ?? res.data
      const liste: Retour[] = Array.isArray(data) ? data : []
      setRetours(liste)
      setTotal(res.data?.total ?? liste.length)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const totalRembourse = retours.reduce((s, r) => s + Number(r.montant_rembourse), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Retours</h1>
          <p className="text-gray-500 text-sm mt-1">{total} retour{total > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouveau retour
        </Button>
      </div>

      {/* Stat */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">Total remboursé</p>
        <p className="text-3xl text-[#E8314A]">{formatMontant(totalRembourse)}</p>
        <p className="text-xs text-gray-400 mt-2">{retours.length} retour{retours.length > 1 ? 's' : ''}</p>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : retours.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun retour</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium w-8"></th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">N° Facture</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Motif</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Mode</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Par</th>
                </tr>
              </thead>
              <tbody>
                {retours.map(r => (
                  <>
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      <td className="py-3 px-4 text-gray-400">
                        {expanded === r.id
                          ? <ChevronDown size={15} />
                          : <ChevronRight size={15} />}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-gray-400" />
                          {formatDate(r.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        {r.vente?.numero_facture ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {r.motif?.libelle ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded bg-[#F4F6F5] text-gray-500">
                          {MODE_LABELS[r.mode_remboursement]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#E8314A] font-medium">
                        {formatMontant(r.montant_rembourse)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {[r.user?.prenom, r.user?.nom].filter(Boolean).join(' ')}
                      </td>
                    </tr>

                    {/* Détail articles */}
                    {expanded === r.id && (
                      <tr key={`detail-${r.id}`} className="bg-[#F4F6F5]">
                        <td colSpan={7} className="px-8 py-3">
                          <div className="space-y-1">
                            {r.details.map(d => {
                              const attrs = d.variante?.attributs
                                ? Object.values(d.variante.attributs).join(' / ')
                                : null
                              return (
                                <div key={d.id} className="flex items-center justify-between text-sm text-gray-600">
                                  <span>
                                    {d.variante?.produit?.designation}
                                    {attrs && <span className="text-gray-400 ml-1">({attrs})</span>}
                                  </span>
                                  <span className="text-gray-400">× {d.quantite}</span>
                                </div>
                              )
                            })}
                            {r.note && (
                              <p className="text-xs text-gray-400 mt-1 italic">Note : {r.note}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RetourForm
        boutiqueId={id}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  )
}