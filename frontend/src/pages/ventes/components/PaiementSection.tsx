import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import { getClients, createClient } from '@/api/clients'
import type { Client } from '@/api/clients'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

export interface PaiementState {
  especes: string
  mobile_money: string
  operateur_id: string
  credit: string
  client_id: string
}

interface Props {
  boutiqueId: number
  totalNet: number
  paiement: PaiementState
  onChange: (p: PaiementState) => void
}

interface NouveauClient {
  nom: string
  prenom: string
  telephone: string
}

const nouveauClientVide: NouveauClient = { nom: '', prenom: '', telephone: '' }

export default function PaiementSection({ boutiqueId, totalNet, paiement, onChange }: Props) {
  const [operateurs, setOperateurs]         = useState<Referentiel[]>([])
  const [clients, setClients]               = useState<Client[]>([])
  const [ajoutClient, setAjoutClient]       = useState(false)
  const [nouveauClient, setNouveauClient]   = useState<NouveauClient>(nouveauClientVide)
  const [creatingClient, setCreatingClient] = useState(false)

  useEffect(() => {
    getReferentiels(boutiqueId, 'operateur_mm').then(res => {
      setOperateurs(Array.isArray(res.data) ? res.data : [])
    })
    chargerClients()
  }, [boutiqueId])

  const chargerClients = () => {
    getClients(boutiqueId, { per_page: 200 }).then(res => {
      const data = res.data?.data ?? res.data
      setClients(Array.isArray(data) ? data : [])
    })
  }

  const set = (k: keyof PaiementState, v: string) => onChange({ ...paiement, [k]: v })

  const especes     = Number(paiement.especes)      || 0
  const mobileMoney = Number(paiement.mobile_money) || 0
  const credit      = totalNet - especes - mobileMoney
  const reliquat    = Math.max(0, credit)
  const monnaie     = Math.max(0, especes + mobileMoney - totalNet)
  const hasMM       = mobileMoney > 0
  const hasCredit   = reliquat > 0

  const handleCreerClient = async () => {
    if (!nouveauClient.nom.trim()) {
      toast.error('Le nom est requis')
      return
    }
    setCreatingClient(true)
    try {
      const res = await createClient(boutiqueId, {
        nom:       nouveauClient.nom.trim(),
        prenom:    nouveauClient.prenom.trim() || undefined,
        telephone: nouveauClient.telephone.trim() || undefined,
      })
      const client: Client = res.data
      setClients(prev => [...prev, client])
      onChange({ ...paiement, client_id: String(client.id) })
      setNouveauClient(nouveauClientVide)
      setAjoutClient(false)
      toast.success(`Client ${client.prenom ? client.prenom + ' ' : ''}${client.nom} créé`)
    } catch {
      toast.error('Erreur lors de la création du client')
    } finally {
      setCreatingClient(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Client */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Client {hasCredit && <span className="text-[#E8314A]">*</span>}</Label>
          {!ajoutClient && (
            <button
              type="button"
              onClick={() => setAjoutClient(true)}
              className="flex items-center gap-1 text-xs text-[#1A7A4A] hover:underline"
            >
              <Plus size={12} /> Nouveau client
            </button>
          )}
        </div>

        {ajoutClient ? (
          <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-[#F4F6F5]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Nouveau client</span>
              <button
                type="button"
                onClick={() => { setAjoutClient(false); setNouveauClient(nouveauClientVide) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <Input
              placeholder="Nom *"
              value={nouveauClient.nom}
              onChange={e => setNouveauClient(p => ({ ...p, nom: e.target.value }))}
              className="h-8 text-sm bg-white"
            />
            <Input
              placeholder="Prénom"
              value={nouveauClient.prenom}
              onChange={e => setNouveauClient(p => ({ ...p, prenom: e.target.value }))}
              className="h-8 text-sm bg-white"
            />
            <Input
              placeholder="Téléphone"
              value={nouveauClient.telephone}
              onChange={e => setNouveauClient(p => ({ ...p, telephone: e.target.value }))}
              className="h-8 text-sm bg-white"
            />
            <Button
              type="button"
              onClick={handleCreerClient}
              disabled={creatingClient || !nouveauClient.nom.trim()}
              className="w-full h-8 text-xs bg-[#1A7A4A] hover:bg-[#145C38] text-white"
            >
              {creatingClient ? 'Création...' : 'Créer et sélectionner'}
            </Button>
          </div>
        ) : (
          <>
            <Select value={paiement.client_id} onValueChange={v => set('client_id', v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Client anonyme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Client anonyme</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                    {c.telephone ? ` · ${c.telephone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasCredit && (!paiement.client_id || paiement.client_id === '0') && (
              <p className="text-xs text-[#E8314A]">Un client est requis pour une vente à crédit</p>
            )}
          </>
        )}
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