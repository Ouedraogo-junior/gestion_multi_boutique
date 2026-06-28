// src/pages/approvisionnements/components/PaiementDrawer.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getReferentiels } from '@/api/referentiels'
import { createPaiementFournisseur, type SoldeFournisseur } from '@/api/approvisionnements'
import { formatMontant } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  boutiqueId: number
  solde: SoldeFournisseur
  onSuccess: (soldeUpdated: Pick<SoldeFournisseur, 'montant_paye' | 'solde_restant' | 'statut_paiement'>) => void
}

export default function PaiementDrawer({ open, onClose, boutiqueId, solde, onSuccess }: Props) {
  const [modes, setModes]                       = useState<{ id: number; libelle: string }[]>([])
  const [montant, setMontant]                   = useState('')
  const [modePaiementId, setModePaiementId]     = useState<number | ''>('')
  const [reference, setReference]               = useState('')
  const [datePaiement, setDatePaiement]         = useState(new Date().toISOString().split('T')[0])
  const [note, setNote]                         = useState('')
  const [loading, setLoading]                   = useState(false)

  useEffect(() => {
    if (!open) return
    getReferentiels(boutiqueId, 'mode_paiement_fournisseur').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setModes(data)
      if (data.length === 1) setModePaiementId(data[0].id)
    })
  }, [open, boutiqueId])

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setMontant('')
      setModePaiementId(modes.length === 1 ? modes[0].id : '')
      setReference('')
      setDatePaiement(new Date().toISOString().split('T')[0])
      setNote('')
    }
  }, [open])

  const modeSelectionne = modes.find(m => m.id === modePaiementId)
  const referenceRequise = modeSelectionne
    ? ['virement', 'virement bancaire', 'chèque', 'cheque'].includes(modeSelectionne.libelle.toLowerCase())
    : false

  const handleSubmit = async () => {
    if (!montant || Number(montant) <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (!modePaiementId) {
      toast.error('Sélectionnez un mode de paiement')
      return
    }
    if (referenceRequise && !reference.trim()) {
      toast.error('La référence est obligatoire pour ce mode de paiement')
      return
    }
    if (Number(montant) > solde.solde_restant) {
      toast.error(`Montant dépasse le solde restant (${formatMontant(solde.solde_restant)})`)
      return
    }

    setLoading(true)
    try {
      const res = await createPaiementFournisseur(boutiqueId, solde.approvisionnement_id, {
        montant: Number(montant),
        mode_paiement_id: modePaiementId as number,
        reference_paiement: reference || undefined,
        date_paiement: datePaiement,
        note: note || undefined,
      })

      toast.success('Versement enregistré')
      onSuccess({
        montant_paye:    res.data.montant_paye,
        solde_restant:   res.data.solde_restant,
        statut_paiement: res.data.statut_paiement,
      })
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-medium text-gray-900">Enregistrer un versement</h2>
            <p className="text-xs text-gray-500 mt-0.5">{solde.reference} — {solde.fournisseur.nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Solde résumé */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Montant dû</div>
            <div className="font-semibold text-gray-800">{formatMontant(solde.montant_du)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Déjà payé</div>
            <div className="font-semibold text-gray-800">{formatMontant(solde.montant_paye)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Solde restant</div>
            <div className="font-semibold text-[#E8314A]">{formatMontant(solde.solde_restant)}</div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1">
            <Label>Montant *</Label>
            <Input
              type="number"
              min={1}
              max={solde.solde_restant}
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder={`Max : ${formatMontant(solde.solde_restant)}`}
              onFocus={e => e.target.select()}
            />
          </div>

          <div className="space-y-1">
            <Label>Mode de paiement *</Label>
            {modes.length === 0 ? (
              <p className="text-xs text-amber-600">
                Aucun mode configuré — ajoutez un référentiel "mode_paiement_fournisseur" dans les paramètres.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {modes.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModePaiementId(m.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      modePaiementId === m.id
                        ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {m.libelle}
                  </button>
                ))}
              </div>
            )}
          </div>

          {referenceRequise && (
            <div className="space-y-1">
              <Label>Référence *</Label>
              <Input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="N° chèque, réf virement..."
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Date du versement *</Label>
            <Input
              type="date"
              value={datePaiement}
              onChange={e => setDatePaiement(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Note (optionnel)</Label>
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Observations..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <Button
            onClick={handleSubmit}
            disabled={loading || modes.length === 0}
            className="flex-1 bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : 'Valider le versement'}
          </Button>
        </div>
      </div>
    </>
  )
}