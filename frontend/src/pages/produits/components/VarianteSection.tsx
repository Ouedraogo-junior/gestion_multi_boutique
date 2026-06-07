import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export interface VarianteForm {
  attributs: Record<string, string>
  prix_vente: string
  seuil_alerte: string
  stock_initial: string
}

interface Props {
  variantes: VarianteForm[]
  onChange: (v: VarianteForm[]) => void
  attributsDisponibles: string[]
}

const emptyVariante = (): VarianteForm => ({
  attributs: {},
  prix_vente: '',
  seuil_alerte: '',
  stock_initial: '',
})

export default function VarianteSection({ variantes, onChange, attributsDisponibles }: Props) {
  const [newAttrKey, setNewAttrKey] = useState('')

  const addVariante = () => onChange([...variantes, emptyVariante()])

  const removeVariante = (i: number) =>
    onChange(variantes.filter((_, idx) => idx !== i))

  const updateVariante = (i: number, field: keyof VarianteForm, value: string) => {
    const updated = [...variantes]
    updated[i] = { ...updated[i], [field]: value }
    onChange(updated)
  }

  const updateAttribut = (i: number, key: string, value: string) => {
    const updated = [...variantes]
    updated[i] = { ...updated[i], attributs: { ...updated[i].attributs, [key]: value } }
    onChange(updated)
  }

  const removeAttribut = (i: number, key: string) => {
    const updated = [...variantes]
    const { [key]: _, ...rest } = updated[i].attributs
    updated[i] = { ...updated[i], attributs: rest }
    onChange(updated)
  }

  const attrKeys = attributsDisponibles.length > 0
    ? attributsDisponibles
    : Object.keys(variantes[0]?.attributs ?? {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Variantes</Label>
        <Button type="button" size="sm" variant="outline" onClick={addVariante}>
          <Plus size={14} className="mr-1" /> Ajouter une variante
        </Button>
      </div>

      {variantes.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          Aucune variante — cliquez sur "Ajouter une variante"
        </p>
      )}

      {variantes.map((v, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Variante {i + 1}</span>
            <button
              type="button"
              onClick={() => removeVariante(i)}
              className="text-gray-400 hover:text-[#E8314A]"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Attributs */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Attributs</Label>
            {attrKeys.map(key => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24 shrink-0">{key}</span>
                <Input
                  value={v.attributs[key] ?? ''}
                  onChange={e => updateAttribut(i, key, e.target.value)}
                  placeholder={`Valeur ${key}`}
                  className="h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAttribut(i, key)}
                  className="text-gray-300 hover:text-[#E8314A]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Ajouter un attribut custom */}
            <div className="flex gap-2 mt-1">
              <Input
                value={newAttrKey}
                onChange={e => setNewAttrKey(e.target.value)}
                placeholder="Nouvel attribut (ex: Couleur)"
                className="h-8 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newAttrKey.trim()) {
                    e.preventDefault()
                    variantes.forEach((_, idx) => updateAttribut(idx, newAttrKey.trim(), ''))
                    setNewAttrKey('')
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  if (newAttrKey.trim()) {
                    variantes.forEach((_, idx) => updateAttribut(idx, newAttrKey.trim(), ''))
                    setNewAttrKey('')
                  }
                }}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Prix + seuil + stock initial */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prix vente (FCFA)</Label>
              <Input
                type="number"
                value={v.prix_vente}
                onChange={e => updateVariante(i, 'prix_vente', e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seuil alerte</Label>
              <Input
                type="number"
                value={v.seuil_alerte}
                onChange={e => updateVariante(i, 'seuil_alerte', e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock initial</Label>
              <Input
                type="number"
                value={v.stock_initial}
                onChange={e => updateVariante(i, 'stock_initial', e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}