import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import type { Produit } from '@/api/produits'
import StockBadge from './StockBadge'
import { formatMontant } from '@/utils/format'

interface Props {
  produits: Produit[]
  boutiqueId: number
  onToggle: (p: Produit) => void
  onDelete: (p: Produit) => void
}

export default function ProduitTable({ produits, boutiqueId, onToggle, onDelete }: Props) {
  const navigate = useNavigate()

  const getStock = (p: Produit) => {
    if (!p.variantes || p.variantes.length === 0) return 0
    return p.variantes.reduce((sum, v) => sum + v.stock_actuel, 0)
  }

  const getSeuil = (p: Produit) => {
    if (!p.variantes || p.variantes.length === 0) return p.seuil_alerte
    return p.variantes.reduce((sum, v) => sum + v.seuil_alerte, 0)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Désignation</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Prix vente</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Stock</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">État</th>
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {produits.map(p => {
            const stock = getStock(p)
            const seuil = getSeuil(p)
            return (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{p.reference}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm text-gray-900">{p.designation}</p>
                    {p.has_variantes && (
                      <p className="text-xs text-gray-400">
                        {p.variantes?.length ?? 0} variante{(p.variantes?.length ?? 0) > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(p.prix_vente)}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{stock}</td>
                <td className="py-3 px-4">
                  <StockBadge stock={stock} seuil={seuil} />
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.etat === 'neuf'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    {p.etat === 'neuf' ? 'Neuf' : 'Occasion'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/boutiques/${boutiqueId}/produits/${p.id}`)}
                      className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                      title="Voir détails"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      onClick={() => navigate(`/boutiques/${boutiqueId}/produits/${p.id}/modifier`)}
                      className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      onClick={() => onToggle(p)}
                      className={`transition-colors ${
                        p.actif
                          ? 'text-gray-400 hover:text-[#E8314A]'
                          : 'text-gray-300 hover:text-[#1A7A4A]'
                      }`}
                      title={p.actif ? 'Désactiver' : 'Activer'}
                    >
                      {p.actif ? <ToggleLeft size={17} /> : <ToggleRight size={17} />}
                    </button>

                    <button
                        onClick={() => onDelete(p)}
                        className="text-gray-400 hover:text-[#E8314A] transition-colors"
                        title="Supprimer"
                        >
                        <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}