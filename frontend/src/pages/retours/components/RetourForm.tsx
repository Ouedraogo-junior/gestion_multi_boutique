import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getReferentiels, type Referentiel } from '@/api/referentiels'
import { createRetour, type RetourPayload } from '@/api/retours'
import { getVentes } from '@/api/ventes'
import type { Vente, VenteDetail } from '@/api/ventes'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

type Props = {
  boutiqueId: number
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function RetourForm({ boutiqueId, open, onClose, onSaved }: Props) {
  const [motifs,      setMotifs]      = useState<Referentiel[]>([])
  const [ventes,      setVentes]      = useState<Vente[]>([])
  const [venteDetails, setVenteDetails] = useState<VenteDetail[]>([])
  const [loading,     setLoading]     = useState(false)

  // Champs formulaire
  const [venteId,      setVenteId]      = useState<string>('')
  const [motifId,      setMotifId]      = useState<string>('')
  const [mode,         setMode]         = useState<'especes' | 'avoir' | 'mobile_money'>('especes')
  const [montant,      setMontant]      = useState<string>('')
  const [note,         setNote]         = useState<string>('')
  const [lignes,       setLignes]       = useState<Record<number, number>>({}) // varianteId → quantite

  useEffect(() => {
    if (!open) return
    // Reset
    setVenteId(''); setMotifId(''); setMode('especes')
    setMontant(''); setNote(''); setLignes({}); setVenteDetails([])

    getReferentiels(boutiqueId, 'motif_retour')
      .then(r => setMotifs(r.data ?? []))
      .catch(() => {})

    // Charger uniquement les ventes validées
    getVentes(boutiqueId, { statut: 'validee', per_page: 100 })
      .then(r => {
        const data = r.data?.data ?? r.data
        setVentes(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [open, boutiqueId])

  // Quand vente sélectionnée → charger ses détails
  const handleVenteChange = (id: string) => {
    setVenteId(id)
    setLignes({})
    setMontant('')
    const vente = ventes.find(v => v.id === Number(id))
    setVenteDetails(vente?.details ?? [])
  }

  const handleLigneQte = (varianteId: number, qte: number) => {
    setLignes(prev => ({ ...prev, [varianteId]: qte }))
  }

  const lignesPayload = Object.entries(lignes)
    .filter(([, q]) => q > 0)
    .map(([varianteId, quantite]) => ({ variante_id: Number(varianteId), quantite }))

  const handleSubmit = async () => {
    if (!venteId) { toast.error('Sélectionner une vente'); return }
    if (lignesPayload.length === 0) { toast.error('Sélectionner au moins un article'); return }
    if (!montant || Number(montant) <= 0) { toast.error('Montant remboursé requis'); return }

    setLoading(true)
    try {
      const payload: RetourPayload = {
        vente_id:          Number(venteId),
        mode_remboursement: mode,
        montant_rembourse:  Number(montant),
        note:               note || undefined,
        motif_id:           motifId ? Number(motifId) : null,
        lignes:             lignesPayload,
      }
      await createRetour(boutiqueId, payload)
      toast.success('Retour enregistré')
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau retour</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Vente */}
          <div className="space-y-2">
            <Label>Vente *</Label>
            <Select value={venteId} onValueChange={handleVenteChange}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Sélectionner une vente validée" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {ventes.map(v => {
                  const client = v.client
                    ? [v.client.prenom, v.client.nom].filter(Boolean).join(' ')
                    : 'Client anonyme'
                  const date = v.date_validation
                    ? new Date(v.date_validation).toLocaleDateString('fr-FR')
                    : '—'
                  return (
                    <SelectItem key={v.id} value={String(v.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.numero_facture ?? `#${v.id}`}</span>
                        <span className="text-xs text-gray-400">{client} · {date} · {formatMontant(v.total_net)}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Récapitulatif vente sélectionnée */}
            {venteId && (() => {
              const vente = ventes.find(v => v.id === Number(venteId))
              if (!vente) return null
              const client = vente.client
                ? [vente.client.prenom, vente.client.nom].filter(Boolean).join(' ')
                : 'Client anonyme'
              return (
                <div className="p-3 bg-[#F4F6F5] rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Facture</span>
                    <span className="font-mono font-medium">{vente.numero_facture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span>{client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{vente.date_validation ? new Date(vente.date_validation).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="text-[#1A7A4A] font-medium">{formatMontant(vente.total_net)}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Articles à retourner */}
          {venteDetails.length > 0 && (
            <div className="space-y-2">
              <Label>Articles à retourner</Label>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {venteDetails.map(d => {
                  const attrs = d.variante?.attributs
                    ? Object.values(d.variante.attributs).join(' / ')
                    : null
                  return (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1C1C1C] truncate">
                          {d.variante?.produit?.designation}
                          {attrs && <span className="text-gray-400 ml-1">({attrs})</span>}
                        </p>
                        <p className="text-xs text-gray-400">Vendu : {d.quantite} × {formatMontant(d.prix_applique)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Qté retour</span>
                        <Input
                          type="number"
                          min={0}
                          max={d.quantite}
                          value={lignes[d.variante_id] ?? 0}
                          onChange={e => handleLigneQte(d.variante_id, Number(e.target.value))}
                          className="w-16 h-8 text-center border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Motif */}
          <div className="space-y-2">
            <Label>Motif</Label>
            <Select value={motifId || 'aucun'} onValueChange={v => setMotifId(v === 'aucun' ? '' : v)}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Sélectionner un motif (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">Sans motif</SelectItem>
                {motifs.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.libelle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode remboursement + montant */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mode de remboursement *</Label>
              <Select value={mode} onValueChange={v => setMode(v as typeof mode)}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="avoir">Avoir</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Montant remboursé (FCFA) *</Label>
              <Input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="0"
                className="border-gray-200"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Observation..."
              className="border-gray-200"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le retour'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}