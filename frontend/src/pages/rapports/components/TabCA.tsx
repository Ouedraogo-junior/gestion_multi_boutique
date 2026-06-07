import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMontant } from '@/utils/format'

type CAData = {
  periode: { debut: string; fin: string }
  boutique: { id: number; nom: string }
  ca: { brut: number; retours: number; net: number; total_remises: number; ecart_prix: number }
  couts: { achat: number; marge_brute: number; depenses: number; benefice_net: number }
  ventes: { count_validees: number; count_brouillons: number; par_mode: Record<string, number> }
}

const MODE_COLORS: Record<string, string> = {
  especes:      '#1A7A4A',
  mobile_money: '#29ABE2',
  credit:       '#E8314A',
}
const MODE_LABELS: Record<string, string> = {
  especes:      'Espèces',
  mobile_money: 'Mobile Money',
  credit:       'Crédit',
}

export default function TabCA({ data }: { data: CAData }) {
  const ca      = data.ca     ?? { brut: 0, retours: 0, net: 0, total_remises: 0, ecart_prix: 0 }
  const couts   = data.couts  ?? { achat: 0, marge_brute: 0, depenses: 0, benefice_net: 0 }
  const ventes  = data.ventes ?? { count_validees: 0, count_brouillons: 0, par_mode: {} }
  const parMode = ventes.par_mode ?? {}

  const pieData = Object.entries(parMode)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name:  MODE_LABELS[key] ?? key,
      value: Number(value),
      color: MODE_COLORS[key] ?? '#999',
    }))

  const kpis = [
    { label: 'CA Net',       value: ca.net,               color: 'text-[#1C1C1C]', bg: 'bg-gray-50'    },
    { label: 'Espèces',      value: parMode.especes ?? 0,      color: 'text-[#1A7A4A]', bg: 'bg-[#D4F0E2]' },
    { label: 'Mobile Money', value: parMode.mobile_money ?? 0, color: 'text-[#29ABE2]', bg: 'bg-blue-50'   },
    { label: 'Crédit',       value: parMode.credit ?? 0,       color: 'text-[#E8314A]', bg: 'bg-red-50'    },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className="text-sm text-gray-500 mb-1">{k.label}</p>
            <p className={`text-xl font-semibold ${k.color}`}>{formatMontant(Number(k.value ?? 0))}</p>
          </div>
        ))}
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">CA Brut</p>
          <p className="text-lg text-[#1C1C1C]">{formatMontant(ca.brut)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Retours</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.retours)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Remises</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.total_remises)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Écart prix</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.ecart_prix)}</p>
        </div>
      </div>

      {/* Marges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Coût achats</p>
          <p className="text-lg text-[#1C1C1C]">{formatMontant(couts.achat)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Marge brute</p>
          <p className={`text-lg ${couts.marge_brute >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]'}`}>
            {formatMontant(couts.marge_brute)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Dépenses</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(couts.depenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Bénéfice net</p>
          <p className={`text-lg font-semibold ${couts.benefice_net >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]'}`}>
            {formatMontant(couts.benefice_net)}
          </p>
        </div>
      </div>

      {/* Ventes count */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Ventes validées</p>
          <p className="text-2xl text-[#1A7A4A]">{ventes.count_validees}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Brouillons en cours</p>
          <p className="text-2xl text-gray-400">{ventes.count_brouillons}</p>
        </div>
      </div>

      {/* Graphique */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm text-gray-500 mb-4">Répartition par mode de paiement</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatMontant(Number(v ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}