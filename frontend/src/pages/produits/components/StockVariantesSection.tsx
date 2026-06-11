// src/pages/produits/components/StockVariantesSection.tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import VarianteSection from './VarianteSection'
import type { VarianteForm } from './VarianteSection'
import type { Referentiel } from '@/api/referentiels'

interface Props {
  hasVariantes: boolean
  isEdit: boolean
  stockInitial: string
  seuilAlerte: string
  variantes: VarianteForm[]
  attributsDisponibles: Referentiel[]
  onStockInitialChange: (v: string) => void
  onSeuilAlerteChange: (v: string) => void
  onVariantesChange: (v: VarianteForm[]) => void
}

export default function StockVariantesSection({
  hasVariantes,
  isEdit,
  stockInitial,
  seuilAlerte,
  variantes,
  attributsDisponibles,
  onStockInitialChange,
  onSeuilAlerteChange,
  onVariantesChange,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-800">Stock & Variantes</h2>
      <Separator />

      {!hasVariantes && !isEdit ? (
        /* Produit simple en création */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Stock initial</Label>
            <Input
              type="number"
              value={stockInitial}
              onFocus={e => e.target.select()}
              onChange={e => onStockInitialChange(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
          <div className="space-y-1">
            <Label>Seuil d'alerte stock</Label>
            <Input
              type="number"
              value={seuilAlerte}
              onFocus={e => e.target.select()}
              onChange={e => onSeuilAlerteChange(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>
      ) : !hasVariantes && isEdit ? (
        /* Produit simple en édition — pas de stock initial */
        <p className="text-xs text-gray-400 italic">
          Pour modifier le stock, utilisez l'entrée en stock depuis la fiche produit.
        </p>
      ) : (
        /* Produit avec variantes */
        <VarianteSection
          variantes={variantes}
          onChange={onVariantesChange}
          attributsDisponibles={attributsDisponibles.map(a => a.libelle)}
          isEdit={isEdit}
        />
      )}
    </div>
  )
}