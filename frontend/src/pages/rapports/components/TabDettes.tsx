import { useState } from 'react'
import { CreditCard, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatMontant, formatDate } from '@/utils/format'
import PaiementDialog from '@/pages/clients/components/PaiementDialog'
import type { Client } from '@/api/clients'

type DetteClient = {
  client_id: number
  nom: string
  prenom: string
  telephone: string
  total_credit: number
  total_paye: number
  solde_dette: number
}

type PaiementPeriode = {
  id: number
  client_id: number
  nom: string
  prenom: string | null
  montant: number
  mode: 'especes' | 'mobile_money'
  date: string
  source: 'vente' | 'dette_initiale'
  numero_facture: string | null
}

type DettesData = {
  boutique_id: number
  total_dettes: number
  clients: DetteClient[]
  periode?: { debut: string; fin: string }
  total_paiements_periode?: number
  paiements_periode?: PaiementPeriode[]
}

const MODE_LABELS: Record<string, string> = {
  especes:      'Espèces',
  mobile_money: 'Mobile Money',
}

export default function TabDettes({ data }: { data: DettesData }) {
  const clients = data.clients ?? []
  const total   = Number(data.total_dettes ?? 0)
  const paiementsPeriode = data.paiements_periode ?? []
  const totalPaiementsPeriode = Number(data.total_paiements_periode ?? 0)

  const [search, setSearch]               = useState('')
  const [clientPaiement, setClientPaiement] = useState<Client | null>(null)

  const clientsFiltres = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.nom?.toLowerCase().includes(q) ||
      c.prenom?.toLowerCase().includes(q) ||
      c.telephone?.toLowerCase().includes(q)
    )
  })

  const ouvrirPaiement = (c: DetteClient) => {
    setClientPaiement({
      id:          c.client_id,
      boutique_id: data.boutique_id,
      nom:         c.nom,
      prenom:      c.prenom    ?? null,
      telephone:   c.telephone ?? null,
      adresse:     null,
      notes:       null,
      total_achat: Number(c.total_credit),
      total_paye:  Number(c.total_paye),
      total_dette: Number(c.solde_dette),
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Total créances clients</p>
        <p className="text-3xl text-[#E8314A]">{formatMontant(total)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {clients.length} client{clients.length > 1 ? 's' : ''} avec dette — solde actuel, indépendant de la période choisie
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="pl-9 border-gray-200"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune dette client</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total crédit</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total payé</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Solde dû</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {clientsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  clientsFiltres.map(c => (
                    <tr key={c.client_id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">
                        {[c.prenom, c.nom].filter(Boolean).join(' ')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{c.telephone ?? '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(Number(c.total_credit))}</td>
                      <td className="py-3 px-4 text-sm text-[#1A7A4A]">{formatMontant(Number(c.total_paye))}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-[#E8314A]">{formatMontant(Number(c.solde_dette))}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => ouvrirPaiement(c)}
                          className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                          title="Enregistrer un paiement"
                        >
                          <CreditCard size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique des paiements reçus sur la période */}
      <div className="bg-[#D4F0E2] rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Paiements reçus sur la période</p>
        <p className="text-3xl text-[#1A7A4A]">{formatMontant(totalPaiementsPeriode)}</p>
        {data.periode && (
          <p className="text-xs text-gray-400 mt-1">
            Du {formatDate(data.periode.debut)} au {formatDate(data.periode.fin)}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Historique des paiements</h3>
        </div>
        {paiementsPeriode.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun paiement reçu sur cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Origine</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Mode</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {paiementsPeriode.map(p => (
                  <tr key={`${p.source}-${p.id}`} className="border-b border-gray-50 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-2.5 px-4 text-sm text-gray-600">{formatDate(p.date)}</td>
                    <td className="py-2.5 px-4 text-sm font-medium text-[#1C1C1C]">
                      {[p.prenom, p.nom].filter(Boolean).join(' ')}
                    </td>
                    <td className="py-2.5 px-4 text-sm text-gray-500">
                      {p.source === 'vente'
                        ? <span className="font-mono text-xs">{p.numero_facture}</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#E8314A]">Dette antérieure</span>
                      }
                    </td>
                    <td className="py-2.5 px-4 text-sm text-gray-500">{MODE_LABELS[p.mode] ?? p.mode}</td>
                    <td className="py-2.5 px-4 text-sm font-medium text-[#1A7A4A] text-right">
                      {formatMontant(Number(p.montant))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaiementDialog
        boutiqueId={data.boutique_id}
        client={clientPaiement}
        onClose={() => setClientPaiement(null)}
        onPaid={() => setClientPaiement(null)}
      />
    </div>
  )
}