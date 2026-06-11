// src/pages/produits/components/LigneImport.tsx
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Referentiel } from '@/api/referentiels'
import type { VarianteForm } from './VarianteSection'
import VariantesInline from './VariantesInline'

export interface LigneProduit {
  designation:   string
  categorie_id:  string
  etat:          'neuf' | 'occasion'
  prix_achat:    string
  prix_vente:    string
  seuil_alerte:  string
  stock_initial: string
  has_variantes: boolean
  variantes:     VarianteForm[]
}

export const ligneVide = (): LigneProduit => ({
  designation:   '',
  categorie_id:  '',
  etat:          'neuf',
  prix_achat:    '',
  prix_vente:    '',
  seuil_alerte:  '0',
  stock_initial: '0',
  has_variantes: false,
  variantes:     [],
})

interface Props {
  ligne:                LigneProduit
  index:                number
  categories:           Referentiel[]
  attributsDisponibles: string[]
  canDelete:            boolean
  onChange:             (i: number, k: keyof LigneProduit, v: unknown) => void
  onDelete:             (i: number) => void
}

export default function LigneImport({
  ligne,
  index,
  categories,
  attributsDisponibles,
  canDelete,
  onChange,
  onDelete,
}: Props) {
  const i = index

  return (
    <div className={`rounded-lg border transition-colors ${
      ligne.has_variantes ? 'border-[#1A7A4A]/30 bg-[#F4F6F5]' : 'border-gray-100'
    } p-2`}>

      {/* Ligne principale */}
      <div className="grid grid-cols-12 gap-2 items-center">

        {/* Désignation */}
        <div className="col-span-3">
          <Input
            value={ligne.designation}
            onChange={e => onChange(i, 'designation', e.target.value)}
            placeholder="Nom du produit"
            className="h-9"
          />
        </div>

        {/* Catégorie */}
        <div className="col-span-2">
          <Select
            value={ligne.categorie_id || 'none'}
            onValueChange={v => onChange(i, 'categorie_id', v === 'none' ? '' : v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* État */}
        <div className="col-span-1">
          <Select
            value={ligne.etat}
            onValueChange={v => onChange(i, 'etat', v as 'neuf' | 'occasion')}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neuf">Neuf</SelectItem>
              <SelectItem value="occasion">Occ.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prix achat */}
        <div className="col-span-1">
          {!ligne.has_variantes ? (
            <Input
              type="number" min={0}
              value={ligne.prix_achat}
              onFocus={e => e.target.select()}
              onChange={e => onChange(i, 'prix_achat', e.target.value)}
              placeholder="0"
              className="h-9"
            />
          ) : (
            <span className="text-xs text-gray-400 italic px-1">par variante</span>
          )}
        </div>

        {/* Prix vente — masqué si has_variantes */}
        <div className="col-span-2">
          {!ligne.has_variantes ? (
            <Input
              type="number"
              min={0}
              value={ligne.prix_vente}
              onFocus={e => e.target.select()}
              onChange={e => onChange(i, 'prix_vente', e.target.value)}
              placeholder="0"
              className="h-9"
            />
          ) : (
            <span className="text-xs text-gray-400 italic px-1">par variante</span>
          )}
        </div>

        {/* Seuil */}
        <div className="col-span-1">
          {!ligne.has_variantes ? (
            <Input
              type="number"
              min={0}
              value={ligne.seuil_alerte}
              onFocus={e => e.target.select()}
              onChange={e => onChange(i, 'seuil_alerte', e.target.value)}
              placeholder="0"
              className="h-9"
            />
          ) : (
            <span className="text-xs text-gray-400 italic px-1">par variante</span>
          )}
        </div>

        {/* Stock initial — masqué si has_variantes */}
        <div className="col-span-1">
          {!ligne.has_variantes ? (
            <Input
              type="number"
              min={0}
              value={ligne.stock_initial}
              onFocus={e => e.target.select()}
              onChange={e => onChange(i, 'stock_initial', e.target.value)}
              placeholder="0"
              className="h-9"
            />
          ) : (
            <span className="text-xs text-gray-400 italic px-1">par variante</span>
          )}
        </div>

        {/* Actions — toggle variantes + supprimer */}
        <div className="col-span-1 flex items-center justify-end gap-1">
          {/* Toggle variantes */}
          <button
            type="button"
            title={ligne.has_variantes ? 'Masquer variantes' : 'Ajouter variantes'}
            onClick={() => onChange(i, 'has_variantes', !ligne.has_variantes)}
            className={`p-1 rounded transition-colors ${
              ligne.has_variantes
                ? 'text-[#1A7A4A] bg-[#D4F0E2]'
                : 'text-gray-300 hover:text-[#1A7A4A]'
            }`}
          >
            {ligne.has_variantes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {/* Supprimer ligne */}
          <button
            type="button"
            onClick={() => onDelete(i)}
            disabled={!canDelete}
            className="p-1 text-gray-300 hover:text-[#E8314A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Sous-panneau variantes */}
      {ligne.has_variantes && (
        <VariantesInline
          variantes={ligne.variantes}
          attributsDisponibles={attributsDisponibles}
          onChange={v => onChange(i, 'variantes', v)}
        />
      )}
    </div>
  )
}