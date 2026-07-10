import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import { getAvances } from '@/api/clients'
import { formatMontant } from '@/utils/format'
import RechercheClientInput from './RechercheClientInput'

export interface PaiementState {
  especes: string
  mobile_money: string
  operateur_id: string
  credit: string
  client_id: string
  avance: string
}

interface Props {
  boutiqueId: number
  totalNet: number
  paiement: PaiementState
  onChange: (p: PaiementState) => void
  onSoldeAvanceChange?: (solde: number | null) => void
}

export default function PaiementSection({ boutiqueId, totalNet, paiement, onChange, onSoldeAvanceChange }: Props) {
  const [operateurs, setOperateurs] = useState<Referentiel[]>([])
  const [soldeAvance, setSoldeAvance] = useState<number | null>(null)
  const [chargementSolde, setChargementSolde] = useState(false)

  useEffect(() => {
    getReferentiels(boutiqueId, 'operateur_mm').then(res => {
      setOperateurs(Array.isArray(res.data) ? res.data : [])
    })
  }, [boutiqueId])

  // Charger le solde d'avance à chaque changement de client sélectionné
  useEffect(() => {
    const clientId = paiement.client_id
    if (!clientId || clientId === '0') {
      setSoldeAvance(null)
      onSoldeAvanceChange?.(null)
      return
    }

    setChargementSolde(true)
    getAvances(boutiqueId, Number(clientId))
      .then(res => {
        setSoldeAvance(res.data.solde_avance)
        onSoldeAvanceChange?.(res.data.solde_avance)
      })
      .catch(() => {
        setSoldeAvance(null)
        onSoldeAvanceChange?.(null)
      })
      .finally(() => setChargementSolde(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paiement.client_id, boutiqueId])

  const set = (k: keyof PaiementState, v: string) => onChange({ ...paiement, [k]: v })

  const especes     = Number(paiement.especes)      || 0
  const mobileMoney = Number(paiement.mobile_money) || 0
  const avance      = Number(paiement.avance)       || 0
  const credit      = totalNet - especes - mobileMoney - avance
  const reliquat    = Math.max(0, credit)
  const monnaie     = Math.max(0, especes + mobileMoney + avance - totalNet)
  const hasMM       = mobileMoney > 0
  const hasAvance   = avance > 0
  const hasCredit   = reliquat > 0
  const avanceDepasseSolde = hasAvance && soldeAvance !== null && avance > soldeAvance

  return (
    <div className="space-y-4">

      {/* Client */}
      <div className="space-y-2">
        <Label>
          Client {(hasCredit || hasAvance) && <span className="text-[#E8314A]">*</span>}
        </Label>
        <RechercheClientInput
          boutiqueId={boutiqueId}
          clientId={paiement.client_id}
          onChange={v => set('client_id', v)}
          required={hasCredit || hasAvance}
        />
      </div>

      {/* Espèces */}
      <div className="space-y-1.5">
        <Label>Espèces (FCFA)</Label>
        <Input
          type="number"
          min={0}
          value={paiement.especes}
          onChange={e => set('especes', e.target.value)}
          placeholder="0"
          className="h-9"
        />
      </div>

      {/* Mobile Money */}
      <div className="space-y-1.5">
        <Label>Mobile Money (FCFA)</Label>
        <Input
          type="number"
          min={0}
          value={paiement.mobile_money}
          onChange={e => set('mobile_money', e.target.value)}
          placeholder="0"
          className="h-9"
        />
        {hasMM && (
          <Select value={paiement.operateur_id} onValueChange={v => set('operateur_id', v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner l'opérateur *" />
            </SelectTrigger>
            <SelectContent>
              {operateurs.map(o => (
                <SelectItem key={o.id} value={String(o.id)}>{o.libelle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasMM && !paiement.operateur_id && (
          <p className="text-xs text-[#E8314A]">Opérateur requis</p>
        )}
      </div>

      {/* Avance client */}
      <div className="space-y-1.5">
        <Label>Avance client (FCFA)</Label>
        <Input
          type="number"
          min={0}
          value={paiement.avance}
          onChange={e => set('avance', e.target.value)}
          placeholder="0"
          disabled={!paiement.client_id || paiement.client_id === '0'}
          className="h-9"
        />
        {!paiement.client_id || paiement.client_id === '0' ? (
          <p className="text-xs text-gray-400">Sélectionnez un client pour utiliser une avance</p>
        ) : chargementSolde ? (
          <p className="text-xs text-gray-400">Chargement du solde...</p>
        ) : soldeAvance !== null && (
          <p className={`text-xs ${avanceDepasseSolde ? 'text-[#E8314A]' : 'text-gray-500'}`}>
            Solde disponible : {formatMontant(soldeAvance)}
          </p>
        )}
        {avanceDepasseSolde && (
          <p className="text-xs text-[#E8314A]">
            Montant supérieur au solde disponible ({formatMontant(soldeAvance ?? 0)})
          </p>
        )}
      </div>

      {/* Résumé */}
      <div className="bg-[#F4F6F5] rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total net</span>
          <span className="font-medium">{formatMontant(totalNet)}</span>
        </div>
        {especes > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Espèces</span>
            <span>{formatMontant(especes)}</span>
          </div>
        )}
        {hasMM && (
          <div className="flex justify-between text-gray-600">
            <span>Mobile Money</span>
            <span>{formatMontant(mobileMoney)}</span>
          </div>
        )}
        {hasAvance && (
          <div className="flex justify-between text-gray-600">
            <span>Avance client</span>
            <span>{formatMontant(avance)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-2 mt-1">
          {reliquat > 0 ? (
            <div className="flex justify-between font-medium text-[#E8314A]">
              <span>Reste à payer (crédit)</span>
              <span>{formatMontant(reliquat)}</span>
            </div>
          ) : (
            <div className="flex justify-between font-medium text-[#1A7A4A]">
              <span>Monnaie à rendre</span>
              <span>{formatMontant(monnaie)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}