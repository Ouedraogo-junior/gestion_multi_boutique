// src/pages/approvisionnements/components/ListeLignesReception.tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatMontant } from '@/utils/format'
import type { LigneReception } from '../ReceptionMarchandisesPage'
import LigneReceptionRow from './LigneReceptionRow'

interface Props {
  lignes: LigneReception[]
  boutiqueId: number
  totalGeneral: number
  note: string
  onAjouterLigne: () => void
  onSupprimerLigne: (key: string) => void
  onUpdateLigne: (key: string, patch: Partial<LigneReception>) => void
  onOuvrirModal: (ligneKey: string, searchTerm: string, payload?: Record<string, unknown>) => void
  onNoteChange: (val: string) => void
}

export default function ListeLignesReception({
  lignes,
  boutiqueId,
  totalGeneral,
  note,
  onAjouterLigne,
  onSupprimerLigne,
  onUpdateLigne,
  onOuvrirModal,
  onNoteChange,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Tableau lignes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800">
            Produits
            {lignes.length > 0 && (
              <span className="ml-2 text-sm text-gray-400 font-normal">
                {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <Button
            type="button"
            onClick={onAjouterLigne}
            variant="outline"
            className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2] gap-2"
          >
            <Plus size={16} /> Ajouter une ligne
          </Button>
        </div>

        {lignes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Cliquez sur "Ajouter une ligne" pour commencer
          </div>
        ) : (
          <div className="space-y-3">
            {/* En-têtes */}
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-0.5">
              <div className="col-span-5">Produit</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-3">Prix achat (FCFA)</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {lignes.map(ligne => (
              <LigneReceptionRow
                key={ligne._key}
                ligne={ligne}
                boutiqueId={boutiqueId}
                onUpdate={patch => onUpdateLigne(ligne._key, patch)}
                onSupprimer={() => onSupprimerLigne(ligne._key)}
                onOuvrirModal={(searchTerm, payload) => onOuvrirModal(ligne._key, searchTerm, payload)}
              />
            ))}

            {/* Total */}
            <div className="flex justify-end pt-3 border-t border-gray-100 gap-4 text-sm">
              <span className="text-gray-400">Total général</span>
              <span className="font-semibold text-[#1A7A4A]">
                {formatMontant(totalGeneral)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
        <Label>Note (optionnel)</Label>
        <Textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Observations, numéro de bon de livraison..."
          rows={2}
        />
      </div>
    </div>
  )
}