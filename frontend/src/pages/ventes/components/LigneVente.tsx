import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatMontant } from '@/utils/format'

export interface Ligne {
  variante_id: number
  produit_id: number
  label: string
  prix_catalogue: number
  prix_applique: number
  quantite: number
  remise_montant: number
  stock_actuel: number
  seuil_alerte: number
}

interface Props {
  ligne: Ligne
  index: number
  onChange: (index: number, champ: keyof Ligne, valeur: number) => void
  onRemove: (index: number) => void
}

export default function LigneVente({ ligne, index, onChange, onRemove }: Props) {
  const total = (ligne.prix_applique * ligne.quantite) - ligne.remise_montant

  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-3">
        <span className="text-sm text-gray-800">{ligne.label}</span>
        {ligne.stock_actuel === 0 && (
          <p className="mt-0.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
              Rupture de stock
            </span>
          </p>
        )}
        {ligne.stock_actuel > 0 && ligne.quantite >= ligne.stock_actuel && (
          <p className="mt-0.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
              Stock faible
            </span>
          </p>
        )}
      </td>
      <td className="py-3 px-3">
        <div>
          <Input
            type="number"
            min={1}
            max={ligne.stock_actuel}
            value={ligne.quantite === 0 ? '' : ligne.quantite}
            onChange={e => {
              const val = e.target.value === '' ? 0 : Number(e.target.value)
              onChange(index, 'quantite', Math.min(val, ligne.stock_actuel))
            }}
            className={`h-8 w-20 text-center text-sm ${ligne.quantite >= ligne.stock_actuel ? 'border-amber-400 focus-visible:ring-amber-300' : ''}`}
          />
          {ligne.quantite >= ligne.stock_actuel && ligne.stock_actuel > 0 && (
            <p className="text-[10px] text-amber-600 mt-0.5 w-20 text-center">
              Max {ligne.stock_actuel}
            </p>
          )}
        </div>
      </td>
      <td className="py-3 px-3">
        <Input
          type="number"
          min={0}
          value={ligne.prix_applique === 0 ? '' : ligne.prix_applique}
          onChange={e => onChange(index, 'prix_applique', e.target.value === '' ? 0 : Number(e.target.value))}
          className="h-8 w-32 text-sm"
        />
      </td>
      <td className="py-3 px-3">
        <Input
          type="number"
          min={0}
          value={ligne.remise_montant === 0 ? '' : ligne.remise_montant}
          onChange={e => onChange(index, 'remise_montant', e.target.value === '' ? 0 : Number(e.target.value))}
          className="h-8 w-28 text-sm"
          placeholder="0"
        />
      </td>
      <td className="py-3 px-3 text-sm font-medium text-gray-900 text-right">
        {formatMontant(total)}
      </td>
      <td className="py-3 px-3">
        <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-[#E8314A]">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}