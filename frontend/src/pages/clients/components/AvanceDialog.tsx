// src/pages/clients/components/AvanceDialog.tsx
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Wallet } from 'lucide-react'
import { storeAvance } from '@/api/clients'
import type { Client, AvanceDepotResponse } from '@/api/clients'
import { getReferentiels } from '@/api/referentiels'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  client: Client | null
  onClose: () => void
}

interface Operateur {
  id: number
  libelle: string
}

export default function AvanceDialog({ boutiqueId, client, onClose }: Props) {
  const [operateurs, setOperateurs] = useState<Operateur[]>([])
  const [loading, setLoading]       = useState(false)

  const [montant, setMontant]         = useState('')
  const [modeDepot, setModeDepot]     = useState<'especes' | 'mobile_money'>('especes')
  const [operateurId, setOperateurId] = useState('')
  const [note, setNote]               = useState('')

  const [resultat, setResultat] = useState<AvanceDepotResponse | null>(null)

  useEffect(() => {
    if (!client) return
    getReferentiels(boutiqueId, 'operateur_mm').then(res => {
      const data = res.data ?? []
      setOperateurs(Array.isArray(data) ? data.map((r: { id: number; libelle: string }) => ({ id: r.id, libelle: r.libelle })) : [])
    })
  }, [client])

  const reset = () => {
    setMontant(''); setModeDepot('especes')
    setOperateurId(''); setNote('')
  }

  const handleSubmit = async () => {
    if (!client) return
    if (!montant || Number(montant) <= 0) { toast.error('Montant invalide'); return }
    if (modeDepot === 'mobile_money' && !operateurId) { toast.error('Sélectionnez un opérateur'); return }

    setLoading(true)
    try {
      const res = await storeAvance(boutiqueId, client.id, {
        montant:      Number(montant),
        mode_depot:   modeDepot,
        operateur_id: operateurId ? Number(operateurId) : null,
        note:         note || undefined,
      })

      setResultat(res.data)
      toast.success('Avance enregistrée')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement de l\'avance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={!!client && !resultat} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une avance</DialogTitle>
          </DialogHeader>

          {client && (
            <div className="space-y-4 py-2">
              {/* Résumé client */}
              <div className="p-4 bg-[#F4F6F5] rounded-lg">
                <p className="text-sm text-gray-500">Client</p>
                <p className="text-base font-medium text-[#1C1C1C]">
                  {[client.prenom, client.nom].filter(Boolean).join(' ')}
                </p>
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <Label>Montant déposé (FCFA) *</Label>
                <Input
                  type="number"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label>Mode de dépôt *</Label>
                <Select value={modeDepot} onValueChange={v => setModeDepot(v as 'especes' | 'mobile_money')}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opérateur MM */}
              {modeDepot === 'mobile_money' && (
                <div className="space-y-2">
                  <Label>Opérateur *</Label>
                  <Select value={operateurId} onValueChange={setOperateurId}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Sélectionner un opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {operateurs.map(o => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.libelle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Note */}
              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optionnel"
                  className="border-gray-200"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
              >
                <CheckCircle size={18} className="mr-2" />
                {loading ? 'Enregistrement...' : 'Valider le dépôt'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation — pas d'impression, un dépôt d'avance n'est pas lié à une facture */}
      <Dialog open={!!resultat} onOpenChange={v => { if (!v) { setResultat(null); reset(); onClose() } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Avance enregistrée</DialogTitle>
          </DialogHeader>
          {resultat && (
            <div className="space-y-3 py-2">
              <div className="flex flex-col items-center gap-2 py-2">
                <Wallet size={28} className="text-[#1A7A4A]" />
                <p className="text-sm text-gray-500 text-center">
                  Dépôt de <strong>{formatMontant(resultat.avance.montant)}</strong> enregistré
                </p>
                <p className="text-sm text-gray-500">Nouveau solde d'avance</p>
                <p className="text-2xl text-[#145C38] font-medium">
                  {formatMontant(resultat.solde_avance_apres)}
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