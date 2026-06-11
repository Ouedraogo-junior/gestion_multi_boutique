// src/pages/produits/components/ProduitTable.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const getStock = (p: Produit) =>
    p.variantes?.reduce((s, v) => s + v.stock_actuel, 0) ?? 0

  const getSeuil = (p: Produit) =>
    p.has_variantes
      ? p.variantes?.reduce((s, v) => s + v.seuil_alerte, 0) ?? 0
      : p.seuil_alerte

  const getAttrsLabel = (attributs: Record<string, string> | null) => {
    if (!attributs) return '—'
    return Object.values(attributs).filter(Boolean).join(' / ') || '—'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium w-6" />
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
            const stock     = getStock(p)
            const seuil     = getSeuil(p)
            const isOpen    = expanded.has(p.id)
            const variantes = p.variantes?.filter(v => !v.est_defaut) ?? []

            return (
              <>
                {/* Ligne produit */}
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors ${
                    isOpen ? 'bg-[#F4F6F5]' : ''
                  }`}
                >
                  {/* Chevron — uniquement si variantes */}
                  <td className="py-3 pl-4 pr-0">
                    {p.has_variantes && variantes.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(p.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isOpen
                          ? <ChevronDown size={15} />
                          : <ChevronRight size={15} />
                        }
                      </button>
                    ) : null}
                  </td>

                  <td className="py-3 px-4 text-xs text-gray-400 font-mono">{p.reference}</td>

                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-900">{p.designation}</p>
                    {p.has_variantes && (
                      <p className="text-xs text-gray-400">
                        {variantes.length} variante{variantes.length > 1 ? 's' : ''}
                        {!isOpen && ' · cliquer pour voir'}
                      </p>
                    )}
                  </td>

                  {/* Prix vente */}
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {p.has_variantes ? (
                      <span className="text-xs text-gray-400 italic">voir variantes</span>
                    ) : (
                      formatMontant(p.prix_vente)
                    )}
                  </td>

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

                {/* Lignes variantes dépliées */}
                {p.has_variantes && isOpen && variantes.map(v => (
                  <tr
                    key={`v-${v.id}`}
                    className="border-b border-gray-100 bg-[#FAFAFA]"
                  >
                    {/* Indent */}
                    <td className="py-2 pl-4 pr-0" />
                    <td className="py-2 px-4" />

                    {/* Attributs */}
                    <td className="py-2 px-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {getAttrsLabel(v.attributs)}
                      </span>
                    </td>

                    {/* Prix vente variante */}
                    <td className="py-2 px-4 text-sm text-gray-700">
                      {formatMontant(v.prix_vente ?? p.prix_vente)}
                    </td>

                    {/* Stock variante */}
                    <td className="py-2 px-4 text-sm text-gray-700">
                      {v.stock_actuel}
                    </td>

                    {/* Badge alerte variante */}
                    <td className="py-2 px-4">
                      <StockBadge stock={v.stock_actuel} seuil={v.seuil_alerte} />
                    </td>

                    <td colSpan={2} />
                  </tr>
                ))}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}