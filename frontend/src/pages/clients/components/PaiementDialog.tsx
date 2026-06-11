import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Printer } from 'lucide-react'
import { storePaiement, getDettes } from '@/api/clients'
import type { Client, Dette } from '@/api/clients'
import { getReferentiels } from '@/api/referentiels'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import RecuPaiementImprimable from './RecuPaiementImprimable'
import { useBoutique } from '@/hooks/useBoutique'

interface Props {
  boutiqueId: number
  client: Client | null
  onClose: () => void
  onPaid: () => void
  onPrintReady?: (data: {
    client: Client
    paiement: {
      montant: number
      mode: 'especes' | 'mobile_money'
      date: string
      vente: { numero_facture: string; total_net: number; solde_restant: number }
    }
  }) => void
}

interface Operateur {
  id: number
  libelle: string
}

export default function PaiementDialog({ boutiqueId, client, onClose, onPaid, onPrintReady }: Props) {
  const [dettes, setDettes]         = useState<Dette[]>([])
  const [totalDette, setTotalDette] = useState(0)
  const [operateurs, setOperateurs] = useState<Operateur[]>([])
  const [loading, setLoading]       = useState(false)
  const [loadingDettes, setLoadingDettes] = useState(false)

  const [venteId, setVenteId]         = useState('')
  const [montant, setMontant]         = useState('')
  const [mode, setMode]               = useState<'especes' | 'mobile_money'>('especes')
  const [operateurId, setOperateurId] = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))

  const { boutiqueActive } = useBoutique()
  const recuRef = useRef<HTMLDivElement>(null)
  
  const [dernierPaiement, setDernierPaiement] = useState<{
    montant: number
    mode: 'especes' | 'mobile_money'
    date: string
    vente: { numero_facture: string; total_net: number; solde_restant: number }
    } | null>(null)

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; }`,
    onAfterPrint: () => {
        setDernierPaiement(null)
        reset()
        onClose()
    },
    })

    // Appel avec délai
    const lancerImpression = () => {
    setTimeout(() => handlePrint(), 100)
    }

  useEffect(() => {
    if (!client) return
    setLoadingDettes(true)
    getDettes(boutiqueId, client.id)
      .then(res => {
        setDettes(res.data.dettes)
        setTotalDette(res.data.total_dette)
        if (res.data.dettes.length === 1) {
          setVenteId(String(res.data.dettes[0].vente_id))
          setMontant(String(res.data.dettes[0].solde_restant))
        }
      })
      .finally(() => setLoadingDettes(false))

    getReferentiels(boutiqueId, 'operateur_mm').then(res => {
      const data = res.data ?? []
      setOperateurs(Array.isArray(data) ? data.map((r: { id: number; libelle: string }) => ({ id: r.id, libelle: r.libelle })) : [])
    })

  }, [client])

  const detteSelectionnee = dettes.find(d => d.vente_id === Number(venteId))

  const handleSubmit = async () => {
    if (!client) return
    if (!venteId) { toast.error('Sélectionnez une facture'); return }
    if (!montant || Number(montant) <= 0) { toast.error('Montant invalide'); return }
    if (mode === 'mobile_money' && !operateurId) { toast.error('Sélectionnez un opérateur'); return }

    setLoading(true)
    try {
      await storePaiement(boutiqueId, client.id, {
        vente_id:     Number(venteId),
        montant:      Number(montant),
        mode,
        operateur_id: operateurId ? Number(operateurId) : null,
        date,
      })

      const paiementData = {
        montant: Number(montant),
        mode,
        date,
        vente: {
            numero_facture: detteSelectionnee!.numero_facture,
            total_net:      detteSelectionnee!.total_net,
            solde_restant:  detteSelectionnee!.solde_restant,
        },
        }
      setDernierPaiement(paiementData)
      onPrintReady?.({ client, paiement: paiementData })
      toast.success('Paiement enregistré')
      onPaid()
      //onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setVenteId(''); setMontant(''); setMode('especes')
    setOperateurId(''); setDate(new Date().toISOString().slice(0, 10))
    setDettes([]); setTotalDette(0)
  }

  return (
    <>
    <Dialog open={!!client} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
        </DialogHeader>

        {client && (
          <div className="space-y-4 py-2">
            {/* Résumé client */}
            <div className="p-4 bg-[#F4F6F5] rounded-lg">
              <p className="text-sm text-gray-500">Client</p>
              <p className="text-base font-medium text-[#1C1C1C]">
                {[client.prenom, client.nom].filter(Boolean).join(' ')}
              </p>
              <p className="text-sm text-gray-500 mt-2">Total restant dû</p>
              <p className="text-2xl text-[#E8314A]">{formatMontant(totalDette)}</p>
            </div>

            {/* Sélection facture */}
            <div className="space-y-2">
              <Label>Facture *</Label>
              {loadingDettes ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : (
                <Select value={venteId} onValueChange={v => {
                  setVenteId(v)
                  const d = dettes.find(d => d.vente_id === Number(v))
                  if (d) setMontant(String(d.solde_restant))
                }}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Sélectionner une facture" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {dettes.map(d => (
                      <SelectItem key={d.vente_id} value={String(d.vente_id)}>
                        <div className="flex flex-col">
                          <span className="font-medium">{d.numero_facture}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(d.date_validation).toLocaleDateString('fr-FR')} · Solde : {formatMontant(d.solde_restant)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Récapitulatif dette sélectionnée */}
              {detteSelectionnee && (
                <div className="p-3 bg-[#F4F6F5] rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facture</span>
                    <span className="font-mono font-medium">{detteSelectionnee.numero_facture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{new Date(detteSelectionnee.date_validation).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total facture</span>
                    <span>{formatMontant(detteSelectionnee.total_net)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-500">Solde restant</span>
                    <span className="text-[#E8314A]">{formatMontant(detteSelectionnee.solde_restant)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <Input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                max={detteSelectionnee?.solde_restant}
                className="border-gray-200"
              />
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label>Mode de paiement *</Label>
              <Select value={mode} onValueChange={v => setMode(v as 'especes' | 'mobile_money')}>
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
            {mode === 'mobile_money' && (
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

            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border-gray-200"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
            >
              <CheckCircle size={18} className="mr-2" />
              {loading ? 'Enregistrement...' : 'Valider le paiement'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Div caché pour impression */}
    <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
    {dernierPaiement && client && boutiqueActive && (
        <RecuPaiementImprimable
        ref={recuRef}
        client={client}
        boutique={boutiqueActive}
        paiement={dernierPaiement}
        logoBase64={boutiqueActive.logo_base64 ?? null}
        />
    )}
    </div>

    {/* Dialog confirmation + impression */}
    <Dialog open={!!dernierPaiement} onOpenChange={v => { if (!v) { setDernierPaiement(null); reset(); onClose() } }}>
        <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
            <DialogTitle>Paiement enregistré</DialogTitle>
        </DialogHeader>
        {dernierPaiement && (
            <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500 text-center">
                Versement de <strong>{formatMontant(dernierPaiement.montant)}</strong> enregistré
            </p>
            <Button
                onClick={lancerImpression}
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
            >
                <Printer size={18} className="mr-2" />
                Imprimer le reçu
            </Button>
            <Button
                variant="outline"
                className="w-full border-gray-200"
                onClick={() => { setDernierPaiement(null); reset(); onClose() }}
            >
                Passer sans imprimer
            </Button>
            </div>
        )}
        </DialogContent>
    </Dialog>
    </>
  )
}