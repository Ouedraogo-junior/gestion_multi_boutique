import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatMontant } from '@/utils/format'

type VarianteStock = {
  variante_id: number
  produit: string
  reference: string
  attributs: Record<string, string> | null
  stock_actuel: number
  seuil_alerte: number
  en_alerte: boolean
  valeur: number
}

type StockData = {
  valeur_stock: number
  total_articles: number
  en_alerte: number
  variantes: VarianteStock[]
}

export default function TabStock({ data }: { data: StockData }) {
  const [search, setSearch] = useState('')

  const variantesFiltrees = (data.variantes ?? []).filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.produit?.toLowerCase().includes(q) || v.reference?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Valeur du stock</p>
          <p className="text-2xl text-[#1A7A4A]">{formatMontant(data.valeur_stock ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total articles</p>
          <p className="text-2xl text-[#1C1C1C]">{data.total_articles ?? 0}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-6">
          <p className="text-sm text-gray-500 mb-1">En alerte stock</p>
          <p className="text-2xl text-[#E8314A]">{data.en_alerte ?? 0}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="pl-9 border-gray-200"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Produit</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Attributs</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Seuil</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Valeur</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {variantesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                variantesFiltrees.map(v => (
                  <tr key={v.variante_id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm text-[#1C1C1C]">{v.produit}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-400">{v.reference}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {v.attributs ? Object.values(v.attributs).join(' / ') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">{v.stock_actuel ?? 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{v.seuil_alerte ?? 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(v.valeur ?? 0)}</td>
                    <td className="py-3 px-4">
                      {v.en_alerte ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-[#E8314A] font-medium">Alerte</span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#D4F0E2] text-[#145C38] font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}