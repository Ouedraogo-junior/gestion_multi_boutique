import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { getProduits } from '@/api/produits'
import type { Produit, Variante } from '@/api/produits'
import { formatMontant } from '@/utils/format'

export interface ProduitSelectionne {
  variante: Variante
  produit: Produit
  label: string
}

interface Props {
  boutiqueId: number
  onSelect: (item: ProduitSelectionne) => void
}

export default function RechercheProduitsInput({ boutiqueId, onSelect }: Props) {
  const [query, setQuery]         = useState('')
  const [resultats, setResultats] = useState<ProduitSelectionne[]>([])
  const [ouvert, setOuvert]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const ref                       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 1) { setResultats([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await getProduits(boutiqueId, { search: query, actif: true, per_page: 50 })
        const produits: Produit[] = res.data?.data ?? res.data ?? []
        const items: ProduitSelectionne[] = []

        produits.forEach(p => {
          if (!p.variantes) return
          p.variantes.filter(v => v.actif).forEach(v => {
            const attrs = v.attributs && Object.keys(v.attributs).length > 0
              ? ' — ' + Object.entries(v.attributs).map(([k, val]) => `${k}: ${val}`).join(' / ')
              : ''
            items.push({
              variante: v,
              produit: p,
              label: p.designation + attrs,
            })
          })
        })
        setResultats(items)
        setOuvert(true)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, boutiqueId])

  const handleSelect = (item: ProduitSelectionne) => {
    onSelect(item)
    setQuery('')
    setResultats([])
    setOuvert(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => resultats.length > 0 && setOuvert(true)}
          placeholder="Rechercher un produit ou scanner..."
          className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>
        )}
      </div>

      {ouvert && resultats.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-50 max-h-72 overflow-y-auto">
          {resultats.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F6F5] text-left transition-colors"
            >
              <div>
                <p className="text-sm text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  Stock : {item.variante.stock_actuel} · Réf : {item.produit.reference}
                  {item.variante.stock_actuel === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                      Rupture
                    </span>
                  )}
                  {item.variante.stock_actuel > 0 && item.variante.stock_actuel <= item.variante.seuil_alerte && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                      Stock faible
                    </span>
                  )}
                </p>
              </div>

              <div className="text-right ml-4 shrink-0">
                <p className="text-sm font-medium text-[#1A7A4A]">
                  {formatMontant(item.variante.prix_vente ?? item.produit.prix_vente)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {ouvert && query.length > 0 && resultats.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-50 px-4 py-3">
          <p className="text-sm text-gray-400">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  )
}