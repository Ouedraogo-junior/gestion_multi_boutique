import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMontant, formatDate } from '@/utils/format'

type DepenseItem = {
  id: number
  montant: number
  description: string | null
  date: string
  categorie: { libelle: string } | null
}

type DepensesData = {
  periode: { debut: string; fin: string }
  total: number
  par_categorie: Record<string, number>
  depenses: DepenseItem[]
}

const COLORS = ['#1A7A4A', '#29ABE2', '#E8314A', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']

export default function TabDepenses({ data }: { data: DepensesData }) {
  const depenses     = data.depenses ?? []
  const parCategorie = data.par_categorie ?? {}
  const total        = Number(data.total ?? 0)

  const pieData = Object.entries(parCategorie).map(([name, value], i) => ({
    name,
    value: Number(value),
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total dépenses</p>
          <p className="text-3xl text-[#E8314A]">{formatMontant(total)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {depenses.length} transaction{depenses.length > 1 ? 's' : ''}
          </p>
        </div>

        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-3">Par catégorie</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMontant(Number(v ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {depenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune dépense sur la période</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Catégorie</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map(d => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500">{formatDate(d.date)}</td>
                    <td className="py-3 px-4 text-sm text-[#1C1C1C]">{d.description ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-[#F4F6F5] text-gray-500 rounded">
                        {d.categorie?.libelle ?? 'Non catégorisé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#E8314A] font-medium">
                      {formatMontant(Number(d.montant))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}