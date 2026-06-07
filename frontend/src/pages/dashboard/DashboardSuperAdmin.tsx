import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { getDashboardGlobal } from '@/api/dashboard'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'
import KpiCard from './components/KpiCard'

type BoutiqueResume = {
  id: number
  nom: string
  ca_mois: number
  depenses_mois: number
  dettes: number
  valeur_stock: number
  nb_alertes: number
}

type GlobalData = {
  mois_en_cours: { ca_total: number; depenses_totales: number }
  global:        { dettes_clients: number; valeur_stock: number; nb_alertes: number; nb_boutiques: number }
  boutiques:     BoutiqueResume[]
}

export default function DashboardSuperAdmin() {
  const navigate = useNavigate()

  const [data,    setData]    = useState<GlobalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardGlobal()
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>
  if (!data)   return null

  const mois   = data.mois_en_cours ?? { ca_total: 0, depenses_totales: 0 }
  const global = data.global        ?? { dettes_clients: 0, valeur_stock: 0, nb_alertes: 0, nb_boutiques: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Vue globale</h1>
        <p className="text-gray-500 text-sm mt-1">{global.nb_boutiques} boutique{global.nb_boutiques > 1 ? 's' : ''} actives — mois en cours</p>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="CA total du mois"   value={formatMontant(Number(mois.ca_total ?? 0))}         color="green" />
        <KpiCard label="Dépenses totales"   value={formatMontant(Number(mois.depenses_totales ?? 0))} color="red"   />
        <KpiCard label="Dettes clients"     value={formatMontant(Number(global.dettes_clients ?? 0))} color="red"   />
        <KpiCard label="Valeur stock total" value={formatMontant(Number(global.valeur_stock ?? 0))}   color="blue"  />
      </div>

      {global.nb_alertes > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-[#E8314A]" />
          <p className="text-sm text-[#E8314A] font-medium">
            {global.nb_alertes} variante{global.nb_alertes > 1 ? 's' : ''} en alerte stock sur l'ensemble des boutiques
          </p>
        </div>
      )}

      {/* Tableau boutiques */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#1C1C1C]">Performance par boutique</h3>
          <button
            onClick={() => navigate('/boutiques')}
            className="text-xs text-[#1A7A4A] hover:underline flex items-center gap-1"
          >
            Gérer les boutiques <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Boutique</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">CA du mois</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Dépenses</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Dettes</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Valeur stock</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Alertes</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(data.boutiques ?? []).map(b => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">{b.nom}</td>
                  <td className="py-3 px-4 text-sm text-[#1A7A4A] font-medium">{formatMontant(Number(b.ca_mois ?? 0))}</td>
                  <td className="py-3 px-4 text-sm text-[#E8314A]">{formatMontant(Number(b.depenses_mois ?? 0))}</td>
                  <td className="py-3 px-4 text-sm text-[#E8314A]">{formatMontant(Number(b.dettes ?? 0))}</td>
                  <td className="py-3 px-4 text-sm text-[#29ABE2]">{formatMontant(Number(b.valeur_stock ?? 0))}</td>
                  <td className="py-3 px-4">
                    {b.nb_alertes > 0 ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-[#E8314A] font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle size={11} />{b.nb_alertes}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-[#D4F0E2] text-[#145C38] font-medium w-fit">OK</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/boutiques/${b.id}/dashboard`)}
                      className="text-xs text-gray-400 hover:text-[#1A7A4A] flex items-center gap-1"
                    >
                      Détail <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}