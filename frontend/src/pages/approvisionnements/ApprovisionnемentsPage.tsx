// src/pages/approvisionnements/ApprovisionnementsPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Eye, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getApprovisionnements,
  getSoldeFournisseur,
  type Approvisionnement,
  type SoldeFournisseur,
} from '@/api/approvisionnements'
import { formatDate, formatMontant } from '@/utils/format'
import PaiementDrawer from './components/PaiementDrawer'

// ─── Badge statut paiement ────────────────────────────────────────────────────
function BadgeStatutPaiement({ statut }: { statut: 'non_paye' | 'partiel' | 'solde' | undefined }) {
  if (!statut) return null
  const config = {
    non_paye: { label: 'Non payé', className: 'bg-red-50 text-red-600 border border-red-200' },
    partiel:  { label: 'Partiel',  className: 'bg-amber-50 text-amber-600 border border-amber-200' },
    solde:    { label: 'Soldé',    className: 'bg-green-50 text-green-600 border border-green-200' },
  }
  const { label, className } = config[statut]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default function ApprovisionnementsPage() {
  const { boutiqueId } = useParams()
  const navigate       = useNavigate()
  const id             = Number(boutiqueId)

  const [appros,  setAppros]  = useState<Approvisionnement[]>([])
  const [loading, setLoading] = useState(true)

  // ── Drawer ────────────────────────────────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [soldeCourant, setSoldeCourant] = useState<SoldeFournisseur | null>(null)
  const [loadingSolde, setLoadingSolde] = useState(false)

  useEffect(() => {
    getApprovisionnements(id)
      .then(res => {
        const data = res.data?.data ?? res.data
        setAppros(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }, [id])

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

  // Mise à jour locale après versement sans recharger toute la liste
  const handleVersementSuccess = (
    approId: number,
    updated: Pick<SoldeFournisseur, 'montant_paye' | 'solde_restant' | 'statut_paiement'>
  ) => {
    setAppros(prev => prev.map(a =>
      a.id === approId
        ? { ...a, statut_paiement: updated.statut_paiement }
        : a
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Approvisionnements</h1>
          <p className="text-gray-500 text-sm mt-1">
            {appros.length} entrée{appros.length > 1 ? 's' : ''} en stock
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/boutiques/${id}/approvisionnements/reception`)}
            className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            <Plus size={18} className="mr-2" />
            Réception de marchandises
          </Button>
          <Button
            onClick={() => navigate(`/boutiques/${id}/approvisionnements/nouveau`)}
            variant="outline"
            className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2]"
          >
            <Plus size={18} className="mr-2" />
            Réapprovisionnement
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : appros.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun approvisionnement</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Fournisseur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Produits</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total dû</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Paiement</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Enregistré par</th>
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
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {a.lignes.length} article{a.lignes.length > 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1A7A4A]">
                        {formatMontant(montantDu)}
                      </td>
                      <td className="py-3 px-4">
                        <BadgeStatutPaiement statut={a.statut_paiement} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {a.user.prenom} {a.user.nom}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Bouton versement — masqué si soldé */}
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

      {/* Drawer paiement */}
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
            onSuccess={(updated) => {
              handleVersementSuccess(soldeCourant.approvisionnement_id, updated)
              setSoldeCourant(prev => prev ? { ...prev, ...updated } : prev)
            }}
          />
        )
      )}
    </div>
  )
}