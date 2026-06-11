// src/pages/approvisionnements/components/LigneReceptionRow.tsx
import { useState, useEffect } from 'react'
import { Trash2, PlusCircle, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getProduits } from '@/api/produits'
import { formatMontant } from '@/utils/format'
import type { LigneReception } from '../ReceptionMarchandisesPage'

interface ProduitOption {
  variante_id: number
  label: string
  reference: string
  prix_achat: number
}

interface Props {
  ligne: LigneReception
  boutiqueId: number
  onUpdate: (patch: Partial<LigneReception>) => void
  onSupprimer: () => void
  onOuvrirModal: (searchTerm: string, payload?: Record<string, unknown>) => void
}

export default function LigneReceptionRow({
  ligne,
  boutiqueId,
  onUpdate,
  onSupprimer,
  onOuvrirModal,
}: Props) {
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<ProduitOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [nothingFound, setNothingFound] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setOptions([])
      setNothingFound(false)
      return
    }
    setSearching(true)
    setNothingFound(false)
    const timer = setTimeout(async () => {
      try {
        const res = await getProduits(boutiqueId, { search, actif: true, per_page: 20 })
        const data = res.data?.data ?? res.data
        const opts: ProduitOption[] = []
        for (const p of data) {
          if (!p.has_variantes) {
            const v = p.variantes?.[0]
            if (v) opts.push({
              variante_id: v.id,
              label: p.designation,
              reference: p.reference,
              prix_achat: Number(p.prix_achat) || 0,
            })
          } else {
            for (const v of p.variantes ?? []) {
              const attrs = v.attributs ? Object.values(v.attributs).join(' / ') : ''
              opts.push({
                variante_id: v.id,
                label: attrs ? `${p.designation} (${attrs})` : p.designation,
                reference: p.reference,
                prix_achat: Number(v.prix_achat) || Number(p.prix_achat) || 0,
              })
            }
          }
        }
        setOptions(opts)
        setNothingFound(opts.length === 0)
        setShowDropdown(true)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, boutiqueId])

  const selectionner = (opt: ProduitOption) => {
    onUpdate({
      variante_id: opt.variante_id,
      label: opt.label,
      reference: opt.reference,
      prix_achat: opt.prix_achat,
      isNew: false,
      newProduitPayload: undefined,
    })
    setSearch('')
    setShowDropdown(false)
  }

  const reinitialiser = () => {
    onUpdate({ variante_id: null, label: '', reference: '', isNew: false, newProduitPayload: undefined })
    setSearch('')
  }

  // Calcul total affiché pour cette ligne
  const totalLigne = ligne.isNew && ligne.newProduitPayload?.has_variantes
    ? (ligne.newProduitPayload.variantes as Array<{ prix_achat?: number; stock_initial?: number }>)
        ?.reduce((s, v) => s + (Number(v.prix_achat) || 0) * (Number(v.stock_initial) || 0), 0) ?? 0
    : ligne.prix_achat * ligne.quantite

  const produitChoisi = ligne.label.trim() !== ''

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      {/* Colonne produit */}
      <div className="col-span-5 relative">
        {produitChoisi ? (
          <div className="flex items-center gap-2 bg-[#F4F6F5] rounded-lg px-3 py-2 text-sm">
            <div className="flex-1 min-w-0">
              <span className="truncate block">{ligne.label}</span>
              {ligne.isNew && (
                <span className="text-xs text-[#1A7A4A] font-medium">nouveau produit</span>
              )}
              {!ligne.isNew && ligne.reference && (
                <span className="text-xs text-gray-400">{ligne.reference}</span>
              )}
            </div>
            <button
              type="button"
              onClick={reinitialiser}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>

            {/* Réouverture de modal */}
            {ligne.isNew && (
              <button
                type="button"
                onClick={() => onOuvrirModal(ligne.label, ligne.newProduitPayload)}
                className="text-gray-400 hover:text-[#1A7A4A] flex-shrink-0"
                title="Modifier"
              >
                <Pencil size={13} />
              </button>
            )}
            {/* <button
              type="button"
              onClick={reinitialiser}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>   */}
            {/* µµµµµµµµµµµµµµµµµµµµµµµ */}

          </div>
        ) : (
          <div>
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => search.length >= 2 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {searching && (
              <p className="text-xs text-gray-400 mt-1 px-1">Recherche...</p>
            )}
            {showDropdown && (options.length > 0 || nothingFound) && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                {options.map(opt => (
                  <button
                    key={opt.variante_id}
                    type="button"
                    onMouseDown={() => selectionner(opt)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F4F6F5] text-sm"
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-gray-400 ml-2 text-xs">{opt.reference}</span>
                  </button>
                ))}
                {nothingFound && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-gray-400">Aucun produit trouvé pour "{search}"</p>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setShowDropdown(false)
                        onOuvrirModal(search)
                      }}
                      className="flex items-center gap-1.5 text-sm text-[#1A7A4A] font-medium hover:underline"
                    >
                      <PlusCircle size={14} />
                      Créer "{search}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quantité — masquée pour nouveaux produits avec variantes (géré dans modal) */}
      <div className="col-span-2">
        {ligne.isNew && ligne.newProduitPayload?.has_variantes ? (
          <span className="text-xs text-gray-400 px-2">voir modal</span>
        ) : (
          <Input
            type="number"
            min={1}
            value={ligne.quantite}
            onFocus={e => e.target.select()}
            onChange={e => onUpdate({ quantite: Number(e.target.value) })}
            placeholder="Qté"
            disabled={!produitChoisi}
          />
        )}
      </div>

      {/* Prix achat — masqué pour nouveaux produits avec variantes */}
      <div className="col-span-3">
        {ligne.isNew && ligne.newProduitPayload?.has_variantes ? (
          <span className="text-xs text-gray-400 px-2">par variante</span>
        ) : (
          <Input
            type="number"
            min={0}
            value={ligne.prix_achat}
            onFocus={e => e.target.select()}
            onChange={e => onUpdate({ prix_achat: Number(e.target.value) })}
            placeholder="Prix achat"
            disabled={!produitChoisi}
          />
        )}
      </div>

      {/* Total */}
      <div className="col-span-1 text-right text-sm text-gray-600 font-medium">
        {produitChoisi ? formatMontant(totalLigne) : '—'}
      </div>

      {/* Supprimer */}
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={onSupprimer}
          className="text-red-400 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}