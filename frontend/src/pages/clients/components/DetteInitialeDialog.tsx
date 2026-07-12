// src/pages/clients/components/DetteInitialeDialog.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, ReceiptText } from 'lucide-react'
import { storeDetteInitiale } from '@/api/clients'
import type { Client, DetteInitialeCreated } from '@/api/clients'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  client: Client | null
  onClose: () => void
}

export default function DetteInitialeDialog({ boutiqueId, client, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [montant, setMontant] = useState('')
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote]       = useState('')

  const [resultat, setResultat] = useState<DetteInitialeCreated | null>(null)

  const reset = () => {
    setMontant(''); setDate(new Date().toISOString().slice(0, 10)); setNote('')
  }

  const handleSubmit = async () => {
    if (!client) return
    if (!montant || Number(montant) <= 0) { toast.error('Montant invalide'); return }
    if (!date) { toast.error('Date requise'); return }

    setLoading(true)
    try {
      const res = await storeDetteInitiale(boutiqueId, client.id, {
        montant: Number(montant),
        date,
        note: note || undefined,
      })
      setResultat(res.data)
      toast.success('Dette antérieure enregistrée')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={!!client && !resultat} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une dette antérieure</DialogTitle>
          </DialogHeader>

          {client && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-[#F4F6F5] rounded-lg">
                <p className="text-sm text-gray-500">Client</p>
                <p className="text-base font-medium text-[#1C1C1C]">
                  {[client.prenom, client.nom].filter(Boolean).join(' ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Montant dû (FCFA) *</Label>
                <Input
                  type="number"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Date de la dette *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ex: solde repris avant informatisation"
                  className="border-gray-200"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
              >
                <CheckCircle size={18} className="mr-2" />
                {loading ? 'Enregistrement...' : 'Valider la dette'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultat} onOpenChange={v => { if (!v) { setResultat(null); reset(); onClose() } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Dette enregistrée</DialogTitle>
          </DialogHeader>
          {resultat && (
            <div className="space-y-3 py-2">
              <div className="flex flex-col items-center gap-2 py-2">
                <ReceiptText size={28} className="text-[#E8314A]" />
                <p className="text-sm text-gray-500 text-center">
                    Dette antérieure de <strong>{formatMontant(resultat.montant)}</strong> enregistrée
                </p>
              </div>
              <Button
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
                onClick={() => { setResultat(null); reset(); onClose() }}
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}