// src/pages/transferts-boutiques/components/PaiementTransfertDrawer.tsx
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getReferentiels } from '@/api/referentiels'
import {
  createPaiementTransfert,
  getAvanceDisponible,
  type SoldeTransfert,
  type AvanceDisponible,
} from '@/api/transferts-boutiques'
import { formatMontant } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  boutiqueId: number
  solde: SoldeTransfert
  onSuccess: (soldeUpdated: Pick<SoldeTransfert, 'montant_paye' | 'solde_restant' | 'statut_paiement'>) => void
}

interface Operateur {
  id: number
  libelle: string
}

export default function PaiementTransfertDrawer({ open, onClose, boutiqueId, solde, onSuccess }: Props) {
  const [operateurs, setOperateurs]           = useState<Operateur[]>([])
  const [avance, setAvance]                   = useState<AvanceDisponible | null>(null)
  const [montant, setMontant]                 = useState('')
  const [mode, setMode]                       = useState<'especes' | 'mobile_money' | 'avance_client'>('especes')
  const [operateurId, setOperateurId]         = useState<number | ''>('')
  const [referencePaiement, setReferencePaiement] = useState('')
  const [datePaiement, setDatePaiement]       = useState(new Date().toISOString().split('T')[0])
  const [note, setNote]                       = useState('')
  const [loading, setLoading]                 = useState(false)

  useEffect(() => {
    if (!open) return
    getReferentiels(boutiqueId, 'operateur_mm').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setOperateurs(data.map((o: { id: number; libelle: string }) => ({ id: o.id, libelle: o.libelle })))
    })
    getAvanceDisponible(boutiqueId, solde.transfert_id).then(r => setAvance(r.data)).catch(() => setAvance(null))
  }, [open, boutiqueId, solde.transfert_id])

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setMontant('')
      setMode('especes')
      setOperateurId('')
      setReferencePaiement('')
      setDatePaiement(new Date().toISOString().split('T')[0])
      setNote('')
    }
  }, [open])

  const soldeMax = mode === 'avance_client' && avance?.disponible
    ? Math.min(solde.solde_restant, avance.solde_avance ?? 0)
    : solde.solde_restant

  const handleSubmit = async () => {
    if (!montant || Number(montant) <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (mode === 'mobile_money' && !operateurId) {
      toast.error('Sélectionnez un opérateur pour le mobile money')
      return
    }
    if (Number(montant) > soldeMax) {
      toast.error(`Montant dépasse le maximum disponible (${formatMontant(soldeMax)})`)
      return
    }

    setLoading(true)
    try {
      const res = await createPaiementTransfert(boutiqueId, solde.transfert_id, {
        montant: Number(montant),
        mode,
        operateur_id: mode === 'mobile_money' ? (operateurId as number) : null,
        client_avance_id: mode === 'avance_client' ? avance?.client_id : undefined,
        reference_paiement: referencePaiement || undefined,
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
            <p className="text-xs text-gray-500 mt-0.5">{solde.reference} — {solde.boutique_destination.nom}</p>
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
          {avance?.disponible && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm">
              <p className="text-[#1A7A4A] font-medium">Avance disponible : {formatMontant(avance.solde_avance ?? 0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Déposée par {avance.client_nom}, déjà en caisse.</p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Montant *</Label>
            <Input
              type="number"
              min={1}
              max={soldeMax}
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder={`Max : ${formatMontant(soldeMax)}`}
              onFocus={e => e.target.select()}
            />
          </div>

          <div className="space-y-1">
            <Label>Mode de paiement *</Label>
            <div className={`grid ${avance?.disponible ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              <button
                type="button"
                onClick={() => setMode('especes')}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  mode === 'especes'
                    ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Espèces
              </button>
              <button
                type="button"
                onClick={() => setMode('mobile_money')}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  mode === 'mobile_money'
                    ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Mobile Money
              </button>
              {avance?.disponible && (
                <button
                  type="button"
                  onClick={() => setMode('avance_client')}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    mode === 'avance_client'
                      ? 'border-[#29ABE2] bg-blue-50 text-[#1A8EC4] font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Avance
                </button>
              )}
            </div>
          </div>

          {mode === 'mobile_money' && (
            <div className="space-y-1">
              <Label>Opérateur *</Label>
              {operateurs.length === 0 ? (
                <p className="text-xs text-amber-600">
                  Aucun opérateur configuré — ajoutez un référentiel "operateur_mm" dans les paramètres.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {operateurs.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOperateurId(o.id)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        operateurId === o.id
                          ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {o.libelle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode !== 'avance_client' && (
            <div className="space-y-1">
              <Label>Référence (optionnel)</Label>
              <Input
                value={referencePaiement}
                onChange={e => setReferencePaiement(e.target.value)}
                placeholder="N° transaction, repère personnel..."
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
            disabled={loading}
            className="flex-1 bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : 'Valider le versement'}
          </Button>
        </div>
      </div>
    </>
  )
}