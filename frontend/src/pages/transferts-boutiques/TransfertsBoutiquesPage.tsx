// src/pages/transferts-boutiques/TransfertsBoutiquesPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Eye, Banknote, AlertCircle, Clock, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getTransferts,
  getSoldeTransfert,
  type TransfertBoutique,
  type SoldeTransfert,
} from '@/api/transferts-boutiques'
import { formatDate, formatMontant } from '@/utils/format'
import PaiementTransfertDrawer from './components/PaiementTransfertDrawer'

// ─── Badge statut — même pattern que DettesFournisseursPage ──────────────────
function BadgeStatut({ statut }: { statut: 'non_paye' | 'partiel' | 'solde' }) {
  const config = {
    non_paye: { label: 'Non payé', icon: AlertCircle,  className: 'bg-red-50 text-red-600 border border-red-200' },
    partiel:  { label: 'Partiel',  icon: Clock,        className: 'bg-amber-50 text-amber-600 border border-amber-200' },
    solde:    { label: 'Soldé',    icon: CheckCircle2, className: 'bg-green-50 text-green-600 border border-green-200' },
  }
  const { label, icon: Icon, className } = config[statut]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

type Direction = 'source' | 'destination' | 'tous'
type Filtre = 'tous' | 'non_paye' | 'partiel' | 'solde'

export default function TransfertsBoutiquesPage() {
  const { boutiqueId } = useParams()
  const navigate       = useNavigate()
  const id             = Number(boutiqueId)

  const [transferts, setTransferts] = useState<TransfertBoutique[]>([])
  const [loading,    setLoading]    = useState(true)
  const [direction,  setDirection]  = useState<Direction>('source')
  const [filtre,     setFiltre]     = useState<Filtre>('tous')

  // Drawer paiement
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [soldeCourant, setSoldeCourant] = useState<SoldeTransfert | null>(null)
  const [loadingSolde, setLoadingSolde] = useState(false)

  const charger = (dir: Direction, f: Filtre) => {
    setLoading(true)
    const params: Record<string, unknown> = { direction: dir, per_page: 100 }
    if (f !== 'tous') params.statut_paiement = f
    getTransferts(id, params)
      .then(res => {
        const data = res.data?.data ?? res.data
        setTransferts(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger(direction, filtre) }, [id])

  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir)
    charger(dir, filtre)
  }

  const handleFiltreChange = (f: Filtre) => {
    setFiltre(f)
    charger(direction, f)
  }

  const ouvrirDrawer = async (t: TransfertBoutique) => {
    setLoadingSolde(true)
    setDrawerOpen(true)
    try {
      const res = await getSoldeTransfert(id, t.id)
      setSoldeCourant(res.data)
    } catch {
      setDrawerOpen(false)
    } finally {
      setLoadingSolde(false)
    }
  }

  const handleVersementSuccess = (
    transfertId: number,
    updated: Pick<SoldeTransfert, 'montant_paye' | 'solde_restant' | 'statut_paiement'>
  ) => {
    setTransferts(prev => prev.map(t =>
      t.id === transfertId
        ? { ...t, solde_restant: updated.solde_restant, statut_paiement: updated.statut_paiement }
        : t
    ))
    setSoldeCourant(prev => prev ? { ...prev, ...updated } : prev)
  }

  // ── Stats calculées depuis la liste chargée, adaptées à la direction ─────
  const totalDu = transferts.reduce((s, t) => s + Number(t.montant_du ?? t.montant_calcule), 0)
  const totalRestant = transferts.reduce((s, t) => s + Number(t.solde_restant ?? 0), 0)
  const nbNonPaye = transferts.filter(t => t.statut_paiement === 'non_paye').length
  const nbPartiel = transferts.filter(t => t.statut_paiement === 'partiel').length
  const nbSolde   = transferts.filter(t => t.statut_paiement === 'solde').length

  const labelMontant = direction === 'destination' ? 'Total dû aux boutiques' : 'Total dû par les boutiques'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Transferts inter-boutiques</h1>
          <p className="text-gray-500 text-sm mt-1">Marchandises cédées entre boutiques et suivi des paiements</p>
        </div>
        <Button
          onClick={() => navigate(`/boutiques/${id}/transferts-boutiques/nouveau`)}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouveau transfert
        </Button>
      </div>

      {/* Direction */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'source',      label: 'Envoyés (ce que les autres nous doivent)' },
          { key: 'destination', label: 'Reçus (ce que nous devons)' },
          { key: 'tous',        label: 'Tous' },
        ] as { key: Direction; label: string }[]).map(d => (
          <button
            key={d.key}
            onClick={() => handleDirectionChange(d.key)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
              direction === d.key
                ? 'bg-[#1A7A4A] text-white border-[#1A7A4A]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">{labelMontant}</p>
          <p className="text-lg font-semibold text-gray-800">{formatMontant(totalDu)}</p>
          <p className="text-xs text-gray-400 mt-1">{transferts.length} transfert{transferts.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Soldés</p>
          <p className="text-lg font-semibold text-green-600">{nbSolde}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Solde restant</p>
          <p className="text-lg font-semibold text-red-500">{formatMontant(totalRestant)}</p>
          <p className="text-xs text-gray-400 mt-1">{nbNonPaye + nbPartiel} en cours</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Répartition</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-red-500 font-medium">{nbNonPaye} non payé</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-amber-500 font-medium">{nbPartiel} partiel</span>
          </div>
        </div>
      </div>

      {/* Filtre statut */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'tous',     label: 'Tous' },
          { key: 'non_paye', label: 'Non payés' },
          { key: 'partiel',  label: 'Partiels' },
          { key: 'solde',    label: 'Soldés' },
        ] as { key: Filtre; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => handleFiltreChange(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
              filtre === f.key
                ? 'bg-[#1A7A4A] text-white border-[#1A7A4A]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : transferts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Aucun transfert {filtre !== 'tous' ? `"${filtre}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Sens</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Solde restant</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transferts.map(t => {
                  const montantDu   = Number(t.montant_du ?? t.montant_calcule)
                  const estSource   = t.boutique_source_id === id
                  const autreBoutique = estSource ? t.boutique_destination : t.boutique_source
                  return (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{t.reference}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          {estSource ? (
                            <ArrowUpRight size={14} className="text-[#1A7A4A]" />
                          ) : (
                            <ArrowDownLeft size={14} className="text-[#E8314A]" />
                          )}
                          <span className="text-gray-700">
                            {estSource ? 'Vers' : 'De'} <span className="font-medium">{autreBoutique?.nom}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatMontant(montantDu)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">
                        {t.statut_paiement === 'solde' ? (
                          <span className="text-green-600 font-medium">Soldé</span>
                        ) : (
                          <span className="text-red-500 font-medium">
                            {formatMontant(t.solde_restant ?? montantDu)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <BadgeStatut statut={t.statut_paiement ?? 'non_paye'} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Seule la boutique source peut enregistrer un versement reçu */}
                          {estSource && t.statut_paiement !== 'solde' && (
                            <button
                              onClick={() => ouvrirDrawer(t)}
                              className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                              title="Enregistrer un versement"
                            >
                              <Banknote size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/boutiques/${id}/transferts-boutiques/${t.id}`)}
                            className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                            title="Voir le détail"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        loadingSolde || !soldeCourant ? (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex items-center justify-center">
              <p className="text-gray-400 text-sm">Chargement...</p>
            </div>
          </>
        ) : (
          <PaiementTransfertDrawer
            open={drawerOpen}
            onClose={() => { setDrawerOpen(false); setSoldeCourant(null) }}
            boutiqueId={id}
            solde={soldeCourant}
            onSuccess={(updated) => handleVersementSuccess(soldeCourant.transfert_id, updated)}
          />
        )
      )}
    </div>
  )
}