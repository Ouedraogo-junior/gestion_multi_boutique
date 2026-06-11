// src/pages/produits/components/VariantesInline.tsx
import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { VarianteForm } from './VarianteSection'

interface Props {
  variantes:            VarianteForm[]
  attributsDisponibles: string[]
  onChange:             (v: VarianteForm[]) => void
}

const emptyVariante = (attrKeys: string[]): VarianteForm => ({
  attributs:     Object.fromEntries(attrKeys.map(k => [k, ''])),
  prix_achat:    '',
  prix_vente:    '',
  seuil_alerte:  '',
  stock_initial: '',
})

export default function VariantesInline({ variantes, attributsDisponibles, onChange }: Props) {
  const [newAttrKey,      setNewAttrKey]      = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [localAttrKeys,   setLocalAttrKeys]   = useState<string[]>([])

  // Colonnes = local + ceux déjà dans les variantes existantes
  const attrKeys = Array.from(
    new Set([...localAttrKeys, ...variantes.flatMap(v => Object.keys(v.attributs))])
  )

  // Suggestions non encore utilisées
  const suggestions = attributsDisponibles.filter(a => !attrKeys.includes(a))

  const addAttrKey = (key: string) => {
    if (!key.trim() || attrKeys.includes(key.trim())) return
    setLocalAttrKeys(prev => [...prev, key.trim()])
    if (variantes.length > 0) {
      onChange(variantes.map(v => ({
        ...v,
        attributs: { ...v.attributs, [key.trim()]: '' },
      })))
    }
    setNewAttrKey('')
    setShowSuggestions(false)
  }

  const removeAttrKey = (key: string) => {
    setLocalAttrKeys(prev => prev.filter(k => k !== key))
    onChange(variantes.map(v => {
      const { [key]: _, ...rest } = v.attributs
      return { ...v, attributs: rest }
    }))
  }

  const add    = () => onChange([...variantes, emptyVariante(attrKeys)])
  const remove = (i: number) => onChange(variantes.filter((_, idx) => idx !== i))

  const updateAttr = (i: number, key: string, val: string) => {
    const updated = [...variantes]
    updated[i] = { ...updated[i], attributs: { ...updated[i].attributs, [key]: val } }
    onChange(updated)
  }

  const updateField = (i: number, k: keyof VarianteForm, val: string) => {
    const updated = [...variantes]
    updated[i] = { ...updated[i], [k]: val }
    onChange(updated)
  }

  return (
    <div className="mt-3 border-t border-dashed border-gray-200 pt-3 space-y-3">

      {/* Gestion des colonnes attributs */}
      <div className="space-y-2">
        <span className="text-xs text-gray-500 font-medium">Attributs des variantes</span>

        <div className="flex flex-wrap gap-2 items-center">
          {attrKeys.map(key => (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-xs bg-[#D4F0E2] text-[#145C38] px-2.5 py-1 rounded-full"
            >
              {key}
              <button
                type="button"
                onClick={() => removeAttrKey(key)}
                className="text-[#1A7A4A] hover:text-[#E8314A] ml-0.5 font-bold"
              >
                ×
              </button>
            </span>
          ))}
          {attrKeys.length === 0 && (
            <span className="text-xs text-gray-400 italic">
              Aucun attribut — ajoutez-en un pour commencer
            </span>
          )}
        </div>

        {/* Zone ajout attribut */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-xs">
            <Input
              value={newAttrKey}
              onChange={e => { setNewAttrKey(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ex: Couleur, Taille..."
              className="h-8 text-sm pr-8"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addAttrKey(newAttrKey) }
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
            />
            {suggestions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSuggestions(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <ChevronDown size={14} />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto">
                {suggestions
                  .filter(s => s.toLowerCase().includes(newAttrKey.toLowerCase()))
                  .map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addAttrKey(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#F4F6F5] text-gray-700"
                    >
                      {s}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2]"
            onClick={() => addAttrKey(newAttrKey)}
          >
            <Plus size={12} className="mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      {/* En-têtes colonnes variantes */}
      {variantes.length > 0 && attrKeys.length > 0 && (
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1 mt-2">
          {attrKeys.map(k => (
            <div key={k} className="col-span-2">{k}</div>
          ))}
          <div className="col-span-2">Prix achat</div>
          <div className="col-span-2">Prix vente</div>
          <div className="col-span-2">Seuil</div>
          <div className="col-span-2">Stock init.</div>
          <div className="col-span-1"></div>
        </div>
      )}

      {/* Lignes variantes */}
      {variantes.map((v, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-2 py-2">
          {attrKeys.map(key => (
            <div key={key} className="col-span-2">
              <Input
                value={v.attributs[key] ?? ''}
                onFocus={e => e.target.select()}
                onChange={e => updateAttr(i, key, e.target.value)}
                placeholder={key}
                className="h-8 text-sm bg-white"
              />
            </div>
          ))}
          
          <div className="col-span-2">
            <Input
              type="number" min={0}
              value={v.prix_achat}
              onFocus={e => e.target.select()}
              onChange={e => updateField(i, 'prix_achat', e.target.value)}
              placeholder="0"
              className="h-8 text-sm bg-white"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number" min={0}
              value={v.prix_vente}
              onFocus={e => e.target.select()}
              onChange={e => updateField(i, 'prix_vente', e.target.value)}
              placeholder="0"
              className="h-8 text-sm bg-white"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number" min={0}
              value={v.seuil_alerte}
              onFocus={e => e.target.select()}
              onChange={e => updateField(i, 'seuil_alerte', e.target.value)}
              placeholder="0"
              className="h-8 text-sm bg-white"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number" min={0}
              value={v.stock_initial}
              onFocus={e => e.target.select()}
              onChange={e => updateField(i, 'stock_initial', e.target.value)}
              placeholder="0"
              className="h-8 text-sm bg-white"
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button type="button" onClick={() => remove(i)} className="text-gray-300 hover:text-[#E8314A]">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* État vide */}
      {variantes.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 rounded-lg">
          {attrKeys.length === 0
            ? "Ajoutez d'abord un attribut (ex: Couleur), puis créez les variantes"
            : 'Cliquez sur "Ajouter une variante" pour commencer'
          }
        </p>
      )}

      <Button
        type="button" size="sm" variant="outline"
        onClick={add}
        disabled={attrKeys.length === 0}
        className="h-7 text-xs border-gray-200 text-gray-500 hover:text-[#1A7A4A] hover:border-[#1A7A4A] disabled:opacity-40"
      >
        <Plus size={12} className="mr-1" /> Ajouter une variante
      </Button>
    </div>
  )
}