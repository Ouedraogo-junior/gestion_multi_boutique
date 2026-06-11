// src/pages/produits/components/PrixSection.tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface PrixFormState {
  prix_achat: string
  prix_vente: string
  seuil_alerte: string
}

interface Props {
  form: PrixFormState
  onChange: (k: keyof PrixFormState, v: string) => void
  hasVariantes: boolean
}

export default function PrixSection({ form, onChange, hasVariantes }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-800">Prix</h2>
      <Separator />

      {!hasVariantes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Prix d'achat (FCFA)</Label>
            <Input
              type="number"
              value={form.prix_achat}
              onFocus={e => e.target.select()}
              onChange={e => onChange('prix_achat', e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Prix de vente (FCFA) *</Label>
            <Input
              type="number"
              value={form.prix_vente}
              onFocus={e => e.target.select()}
              onChange={e => onChange('prix_vente', e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Seuil d'alerte</Label>
            <Input
              type="number"
              value={form.seuil_alerte}
              onFocus={e => e.target.select()}
              onChange={e => onChange('seuil_alerte', e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Prix d'achat, prix de vente et seuil d'alerte définis par variante.
        </p>
      )}
    </div>
  )
}