// src/pages/approvisionnements/DettesFournisseursPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Eye, Banknote, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { getApprovisionnements, getSoldeFournisseur, type Approvisionnement, type SoldeFournisseur } from '@/api/approvisionnements'
import { formatDate, formatMontant } from '@/utils/format'
import PaiementDrawer from './components/PaiementDrawer'

// ─── Badge ────────────────────────────────────────────────────────────────────
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

// ─── Filtre actif ─────────────────────────────────────────────────────────────
type Filtre = 'tous' | 'non_paye' | 'partiel' | 'solde'

export default function DettesFournisseursPage() {
  const { boutiqueId } = useParams()
  const navigate       = useNavigate()
  const id             = Number(boutiqueId)

  const [appros,   setAppros]   = useState<Approvisionnement[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filtre,   setFiltre]   = useState<Filtre>('non_paye')

  // Drawer
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [soldeCourant, setSoldeCourant] = useState<SoldeFournisseur | null>(null)
  const [loadingSolde, setLoadingSolde] = useState(false)

  const charger = (f: Filtre) => {
    setLoading(true)
    const params = f !== 'tous' ? { statut_paiement: f, per_page: 100 } : { per_page: 100 }
    getApprovisionnements(id, params)
      .then(res => {
        const data = res.data?.data ?? res.data
        setAppros(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger(filtre) }, [id])

  const handleFiltreChange = (f: Filtre) => {
    setFiltre(f)
    charger(f)
  }

  const ouvrirDrawer = async (appro: Approvisionnement) => {
    setLoadingSolde(true)
    setDrawerOpen(true)
    try {
      const res = await getSoldeFournisseur(id, appro.id)
      setSoldeCourant(res.data)
    } catch {
      setDrawerOpen(false)
    } finally {
      setLoadingSolde(false)
    }
  }

  const handleVersementSuccess = (
    approId: number,
    updated: Pick<SoldeFournisseur, 'montant_paye' | 'solde_restant' | 'statut_paiement'>
  ) => {
    setAppros(prev => prev.map(a =>
      a.id === approId
        ? { ...a, statut_paiement: updated.statut_paiement }
        : a
    ))
    setSoldeCourant(prev => prev ? { ...prev, ...updated } : prev)
  }

  // ── Stats calculées depuis la liste chargée ───────────────────────────────
  const totalDu    = appros.reduce((s, a) => s + Number(a.montant_total_facture ?? a.montant_calcule), 0)
  const totalPaye  = appros.reduce((s, a) => {
    const du   = Number(a.montant_total_facture ?? a.montant_calcule)
    const stat = a.statut_paiement
    if (stat === 'solde') return s + du
    return s
  }, 0)
  const totalRestant = appros.reduce((s, a) => {
    if (a.statut_paiement === 'solde') return s
    return s + Number(a.montant_total_facture ?? a.montant_calcule)
  }, 0)

  const nbNonPaye = appros.filter(a => a.statut_paiement === 'non_paye').length
  const nbPartiel = appros.filter(a => a.statut_paiement === 'partiel').length
  const nbSolde   = appros.filter(a => a.statut_paiement === 'solde').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Dettes fournisseurs</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi des paiements fournisseurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Total facturé</p>
          <p className="text-lg font-semibold text-gray-800">{formatMontant(totalDu)}</p>
          <p className="text-xs text-gray-400 mt-1">{appros.length} appro{appros.length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Total payé</p>
          <p className="text-lg font-semibold text-green-600">{formatMontant(totalPaye)}</p>
          <p className="text-xs text-gray-400 mt-1">{nbSolde} soldé{nbSolde > 1 ? 's' : ''}</p>
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

      {/* Filtres */}
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
        ) : appros.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Aucun approvisionnement {filtre !== 'tous' ? `"${filtre}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Fournisseur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Montant total</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Reste à payer</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appros.map(a => {
                  const montantDu = Number(a.montant_total_facture ?? a.montant_calcule)
                  return (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{a.reference}</td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">
                        {a.fournisseur.nom}
                        {a.fournisseur.provenance && (
                          <span className="text-xs text-gray-400 ml-1">· {a.fournisseur.provenance}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatMontant(montantDu)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">
                        {a.statut_paiement === 'solde' ? (
                            <span className="text-green-600 font-medium">Soldé</span>
                        ) : (
                            <span className="text-red-500 font-medium">
                            {formatMontant(a.solde_restant ?? montantDu)}
                            </span>
                        )}
                        </td>
                      <td className="py-3 px-4">
                        <BadgeStatut statut={a.statut_paiement ?? 'non_paye'} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {a.statut_paiement !== 'solde' && (
                            <button
                              onClick={() => ouvrirDrawer(a)}
                              className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                              title="Enregistrer un versement"
                            >
                              <Banknote size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/boutiques/${id}/approvisionnements/${a.id}`)}
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
          <PaiementDrawer
            open={drawerOpen}
            onClose={() => { setDrawerOpen(false); setSoldeCourant(null) }}
            boutiqueId={id}
            solde={soldeCourant}
            onSuccess={(updated) => handleVersementSuccess(soldeCourant.approvisionnement_id, updated)}
          />
        )
      )}
    </div>
  )
}