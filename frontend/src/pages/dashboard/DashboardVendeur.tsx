import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDashboardBoutique } from '@/api/dashboard'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import KpiCard from './components/KpiCard'
import AccesRapides from './components/AccesRapides'

type VenteVendeur = {
  id: number
  numero_facture: string
  total_net: number
  date_validation: string
}

type DashboardData = {
  aujourd_hui:         { ca: number; nb_ventes: number }
  mois_en_cours:       { ca: number; nb_ventes: number }
  stock:               { nb_alertes: number; alertes: { variante_id: number; produit: string; stock_actuel: number; seuil_alerte: number }[] }
  dettes_clients:      number
  mes_ventes_aujourd_hui: VenteVendeur[]
}

export default function DashboardVendeur() {
  const { boutiqueId } = useParams()
  const navigate       = useNavigate()
  const id             = Number(boutiqueId)

  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardBoutique(id)
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>
  if (!data)   return null

  const mesVentes = data.mes_ventes_aujourd_hui ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Aujourd'hui</p>
        </div>
        <Button
          onClick={() => navigate(`/boutiques/${id}/ventes/nouvelle`)}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouvelle vente
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Mon CA aujourd'hui"
          value={formatMontant(Number(data.aujourd_hui?.ca ?? 0))}
          sub={`${data.aujourd_hui?.nb_ventes ?? 0} vente(s)`}
          color="green"
        />
        <KpiCard
          label="CA du mois"
          value={formatMontant(Number(data.mois_en_cours?.ca ?? 0))}
          sub={`${data.mois_en_cours?.nb_ventes ?? 0} ventes`}
          color="green"
        />
        <KpiCard
          label="Mes ventes aujourd'hui"
          value={mesVentes.length}
          color="blue"
        />
        <KpiCard
          label="Alertes stock"
          value={data.stock?.nb_alertes ?? 0}
          color={data.stock?.nb_alertes > 0 ? 'red' : 'green'}
        />
      </div>

      <AccesRapides boutiqueId={id} role="vendeur" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mes ventes du jour */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">Mes ventes du jour</h3>
          {mesVentes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune vente aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {mesVentes.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-mono text-[#1C1C1C]">{v.numero_facture}</p>
                    <p className="text-xs text-gray-400">{formatDate(v.date_validation)}</p>
                  </div>
                  <p className="text-sm text-[#1A7A4A] font-medium">{formatMontant(v.total_net)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes stock */}
        {(data.stock?.alertes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-[#1C1C1C] mb-4">Alertes stock</h3>
            <div className="space-y-2">
              {data.stock.alertes.map(a => (
                <div key={a.variante_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#E8314A]" />
                    <span className="text-sm text-[#1C1C1C]">{a.produit}</span>
                  </div>
                  <span className="text-xs text-[#E8314A] font-medium">
                    {a.stock_actuel} / {a.seuil_alerte}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}