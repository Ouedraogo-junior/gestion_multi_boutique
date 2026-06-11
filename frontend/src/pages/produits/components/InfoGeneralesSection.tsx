// src/pages/produits/components/InfoGeneralesSection.tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Referentiel } from '@/api/referentiels'

export interface InfoGeneralesFormState {
  designation: string
  categorie_id: string
  etat: string
  description: string
}

interface Props {
  form: InfoGeneralesFormState
  onChange: (k: keyof InfoGeneralesFormState, v: string) => void
  categories: Referentiel[]
  hasVariantes: boolean
  onToggleVariantes?: () => void
  isEdit?: boolean
}

export default function InfoGeneralesSection({
  form,
  onChange,
  categories,
  hasVariantes,
  onToggleVariantes,
  isEdit = false,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-800">Informations générales</h2>

        {/* Toggle variantes — uniquement en création */}
        {!isEdit && onToggleVariantes && (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <div className="text-right">
              <p className="text-sm font-medium text-[#1C1C1C]">Avec variantes</p>
              <p className="text-xs text-gray-400">
                {hasVariantes ? 'Couleur, capacité...' : 'Produit simple'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleVariantes}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                hasVariantes ? 'bg-[#1A7A4A]' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                hasVariantes ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        )}
      </div>

      <Separator />

      {/* Désignation */}
      <div className="space-y-1">
        <Label>Désignation *</Label>
        <Input
          value={form.designation}
          onChange={e => onChange('designation', e.target.value)}
          placeholder="Ex: iPhone 15 Pro"
          required
        />
      </div>

      {/* Catégorie + État */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Catégorie</Label>
          <Select
            value={form.categorie_id}
            onValueChange={v => onChange('categorie_id', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>État *</Label>
          <Select value={form.etat} onValueChange={v => onChange('etat', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neuf">Neuf</SelectItem>
              <SelectItem value="occasion">Occasion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Description du produit..."
          rows={3}
        />
      </div>
    </div>
  )
}