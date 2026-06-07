import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getDashboardBoutique } from '@/api/dashboard'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import KpiCard from './components/KpiCard'
import AccesRapides from './components/AccesRapides'

type DashboardData = {
  aujourd_hui: {
    ca: number
    nb_ventes: number
    recouvrement: number
  }
  mois_en_cours:  { ca: number; nb_ventes: number }
  stock:          { nb_alertes: number; alertes: { variante_id: number; produit: string; stock_actuel: number; seuil_alerte: number }[] }
  dettes_clients: number
  admin: {
    depenses_mois:       number
    retours_mois:        number
    benefice_mois:       number
    cout_achat_mois:     number
    depenses_aujourdhui: number
    retours_aujourdhui:  number
    benefice_aujourdhui: number
  }
  dernieres_ventes: {
    id: number
    numero_facture: string
    client: string
    vendeur: string
    total_net: number
    date_validation: string
  }[]
}

export default function DashboardAdmin() {
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

  const admin = data.admin ?? {
    depenses_mois: 0, retours_mois: 0, benefice_mois: 0, cout_achat_mois: 0,
    depenses_aujourdhui: 0, retours_aujourdhui: 0, benefice_aujourdhui: 0,
  }
  // const benefice    = Number(admin.benefice_mois ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Mois en cours</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="CA aujourd'hui"
          value={formatMontant(Number(data.aujourd_hui?.ca ?? 0))}
          sub={`${data.aujourd_hui?.nb_ventes ?? 0} vente(s)`}
          color="green"
        />
        <KpiCard
          label="Recouvrement du jour"
          value={formatMontant(Number(data.aujourd_hui?.recouvrement ?? 0))}
          sub="dettes encaissées"
          color="green"
        />
        <KpiCard
          label="Dépenses du jour"
          value={formatMontant(Number(admin.depenses_aujourdhui ?? 0))}
          color="red"
        />
        <KpiCard
          label="Retours du jour"
          value={formatMontant(Number(admin.retours_aujourdhui ?? 0))}
          color="red"
        />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
        <KpiCard
          label="Bénéfice du jour"
          value={formatMontant(Number(admin.benefice_aujourdhui ?? 0))}
          color={Number(admin.benefice_aujourdhui ?? 0) >= 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="Dettes clients"
          value={formatMontant(Number(data.dettes_clients ?? 0))}
          color="red"
        />
        <KpiCard
          label="Alertes stock"
          value={data.stock?.nb_alertes ?? 0}
          sub="variantes sous seuil"
          color={data.stock?.nb_alertes > 0 ? 'red' : 'green'}
        />
      </div>

      {/* KPIs secondaires */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Dépenses du mois"  value={formatMontant(Number(admin.depenses_mois ?? 0))}   color="red"     />
        <KpiCard label="Retours du mois"   value={formatMontant(Number(admin.retours_mois ?? 0))}    color="red"     />
        <KpiCard label="Coût achats"       value={formatMontant(Number(admin.cout_achat_mois ?? 0))} color="default" />
        <KpiCard
          label="Alertes stock"
          value={data.stock?.nb_alertes ?? 0}
          sub="variantes sous seuil"
          color={data.stock?.nb_alertes > 0 ? 'red' : 'green'}
        />
      </div> */}

      <AccesRapides boutiqueId={id} role="admin_boutique" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertes stock */}
        {(data.stock?.alertes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#1C1C1C]">Alertes stock</h3>
              <button
                onClick={() => navigate(`/boutiques/${id}/produits`)}
                className="text-xs text-[#1A7A4A] hover:underline flex items-center gap-1"
              >
                Voir produits <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {data.stock.alertes.map(a => (
                <div key={a.variante_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#E8314A]" />
                    <span className="text-sm text-[#1C1C1C]">{a.produit}</span>
                  </div>
                  <span className="text-xs text-[#E8314A] font-medium">
                    Stock : {a.stock_actuel} / seuil : {a.seuil_alerte}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dernières ventes */}
        {(data.dernieres_ventes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#1C1C1C]">Dernières ventes</h3>
              <button
                onClick={() => navigate(`/boutiques/${id}/ventes`)}
                className="text-xs text-[#1A7A4A] hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {data.dernieres_ventes.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-[#1C1C1C] font-mono">{v.numero_facture}</p>
                    <p className="text-xs text-gray-400">{v.client?.trim() || 'Client anonyme'} — {v.vendeur}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#1A7A4A] font-medium">{formatMontant(v.total_net)}</p>
                    <p className="text-xs text-gray-400">{formatDate(v.date_validation)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}