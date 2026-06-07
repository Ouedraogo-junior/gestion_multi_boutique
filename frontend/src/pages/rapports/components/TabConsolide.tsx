import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatMontant } from '@/utils/format'

type BoutiqueConsolide = {
  id: number
  nom: string
  ca: number
  benefice: number
  depenses: number
  dettes: number
  stock: number
}

type ConsolideData = {
  periode: { debut: string; fin: string }
  ca_total: number
  benefice_net_total: number
  depenses_totales: number
  dettes_clients_total: number
  valeur_stock_total: number
  boutiques: BoutiqueConsolide[]
}

export default function TabConsolide({ data }: { data: ConsolideData }) {
  const boutiques = data.boutiques ?? []

  const chartData = boutiques.map(b => ({
    name: b.nom.replace('Boutique ', ''),
    CA:   b.ca,
    Bénéfice: b.benefice,
  }))

  const kpis = [
    { label: 'CA Total',         value: data.ca_total,             color: 'text-[#1C1C1C]',  bg: 'bg-gray-50'       },
    { label: 'Bénéfice net',     value: data.benefice_net_total,   color: data.benefice_net_total >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]', bg: data.benefice_net_total >= 0 ? 'bg-[#D4F0E2]' : 'bg-red-50' },
    { label: 'Dépenses totales', value: data.depenses_totales,     color: 'text-[#E8314A]',  bg: 'bg-red-50'        },
    { label: 'Dettes clients',   value: data.dettes_clients_total, color: 'text-[#E8314A]',  bg: 'bg-red-50'        },
    { label: 'Valeur stock',     value: data.valeur_stock_total,   color: 'text-[#29ABE2]',  bg: 'bg-blue-50'       },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-lg font-semibold ${k.color}`}>{formatMontant(Number(k.value))}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">CA vs Bénéfice par boutique</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v) => formatMontant(Number(v ?? 0))} />
              <Bar dataKey="CA" fill="#1A7A4A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bénéfice" fill="#29ABE2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {boutiques.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune donnée boutique</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Boutique</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">CA</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Bénéfice</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Dépenses</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Dettes</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {boutiques.map(b => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">{b.nom}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(b.ca)}</td>
                    <td className={`py-3 px-4 text-sm font-medium ${b.benefice >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]'}`}>
                      {formatMontant(b.benefice)}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#E8314A]">{formatMontant(Number(b.depenses))}</td>
                    <td className="py-3 px-4 text-sm text-[#E8314A]">{formatMontant(Number(b.dettes))}</td>
                    <td className="py-3 px-4 text-sm text-[#29ABE2]">{formatMontant(b.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}