import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, Pencil, CreditCard, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getClients, getPaiements } from '@/api/clients'
import type { Client, PaiementHistorique } from '@/api/clients'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'
import { useBoutique } from '@/hooks/useBoutique'
import ClientForm from './components/ClientForm'
import PaiementDialog from './components/PaiementDialog'
import RecuPaiementImprimable from './components/RecuPaiementImprimable'
import ClientFilters, { defaultFilters, type ClientFilterValues } from './components/ClientFilters'

export default function ClientsPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)
  const { boutiqueActive } = useBoutique()

  const [clients, setClients]               = useState<Client[]>([])
  const [total, setTotal]                   = useState(0)
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [formOpen, setFormOpen]             = useState(false)
  const [clientEdit, setClientEdit]         = useState<Client | null>(null)
  const [clientPaiement, setClientPaiement] = useState<Client | null>(null)

  const [filters, setFilters] = useState<ClientFilterValues>(defaultFilters)

  // Historique paiements : Map clientId → dernier paiement
  const [historiquesPaiements, setHistoriquesPaiements] =
    useState<Record<number, PaiementHistorique>>({})

  const [recuClient, setRecuClient] = useState<Client | null>(null)
  const recuRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; }`,
    onAfterPrint: () => setRecuClient(null),
  })

  const lancerImpression = (client: Client) => {
    setRecuClient(client)
    setTimeout(() => handlePrint(), 100)
  }

  const load = async (q = '') => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 50 }
      if (q) params.search = q
      const res  = await getClients(id, params)
      const data = res.data?.data ?? res.data
      const liste: Client[] = Array.isArray(data) ? data : []
      setClients(liste)
      setTotal(res.data?.total ?? liste.length)

      // Charger le dernier paiement pour chaque client qui a des paiements
      const entries = await Promise.all(
        liste.map(async c => {
          try {
            const r = await getPaiements(id, c.id)
            const paiements: PaiementHistorique[] = r.data
            if (paiements.length > 0) return [c.id, paiements[0]] as const
          } catch { /* client sans paiement */ }
          return null
        })
      )
      const map: Record<number, PaiementHistorique> = {}
      entries.forEach(e => { if (e) map[e[0]] = e[1] })
      setHistoriquesPaiements(map)

    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const totalDettes = clients.reduce((s, c) => s + Number(c.total_dette ?? 0), 0)
  const avecDette   = clients.filter(c => Number(c.total_dette ?? 0) > 0).length

  const aujourdhui = new Date().toISOString().slice(0, 10)
  const recouvrementDuJour = Object.values(historiquesPaiements)
    .filter(p => p.date?.slice(0, 10) === aujourdhui)
    .reduce((s, p) => s + Number(p.montant ?? 0), 0)

  const clientsFiltres = clients.filter(c => {
    const dette = Number(c.total_dette ?? 0)

    // Filtre statut
    if (filters.statut === 'avec_dette' && dette <= 0) return false
    if (filters.statut === 'en_regle'   && dette >  0) return false

    // Filtre date dernier paiement
    if (filters.dateDebut || filters.dateFin) {
        const dernierPai = historiquesPaiements[c.id]
        if (!dernierPai) return false

        const datePai = new Date(dernierPai.date)
        datePai.setHours(0, 0, 0, 0)

        if (filters.dateDebut) {
        const debut = new Date(filters.dateDebut)
        debut.setHours(0, 0, 0, 0)
        if (datePai < debut) return false
        }
        if (filters.dateFin) {
        const fin = new Date(filters.dateFin)
        fin.setHours(23, 59, 59, 999)
        if (datePai > fin) return false
        }
    }

    return true
})

  const handleSaved = (client: Client) => {
    setClients(prev => {
      const existe = prev.findIndex(c => c.id === client.id)
      if (existe >= 0) return prev.map(c => c.id === client.id ? client : c)
      return [client, ...prev]
    })
    setTotal(prev => clientEdit ? prev : prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Clients & Dettes</h1>
          <p className="text-gray-500 text-sm mt-1">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => { setClientEdit(null); setFormOpen(true) }}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total clients</p>
          <p className="text-3xl text-[#1C1C1C]">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Clients avec dettes</p>
          <p className="text-3xl text-[#E8314A]">{avecDette}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Créances totales</p>
          <p className="text-3xl text-[#E8314A]">{formatMontant(totalDettes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Recouvrement du jour</p>
          <p className="text-3xl text-[#1A7A4A]">{formatMontant(recouvrementDuJour)}</p>
        </div>
      </div>

      {/* Recherche + Filtres */}
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou téléphone..."
            className="pl-10 border-gray-200"
            />
      </div>
    </div>

    <ClientFilters
    values={filters}
    onChange={setFilters}
    onReset={() => setFilters(defaultFilters)}
    />

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun client</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total achats</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total payé</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Créances</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clientsFiltres.map(c => {
                  const dette      = Number(c.total_dette ?? 0)
                  const dernierPai = historiquesPaiements[c.id]
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-[#1C1C1C]">
                          {[c.prenom, c.nom].filter(Boolean).join(' ')}
                        </p>
                        {c.adresse && <p className="text-xs text-gray-400">{c.adresse}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {c.telephone ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {formatMontant(Number(c.total_achat ?? 0))}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#1A7A4A]">
                        {formatMontant(Number(c.total_paye ?? 0))}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {dette > 0
                          ? <span className="text-[#E8314A] font-medium">{formatMontant(dette)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {dette > 0 ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-[#E8314A]">
                            Dette en cours
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#D4F0E2] text-[#145C38]">
                            En règle
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setClientEdit(c); setFormOpen(true) }}
                            className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          {dette > 0 && (
                            <button
                              onClick={() => setClientPaiement(c)}
                              className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                              title="Enregistrer un paiement"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          {/* Bouton impression permanent si au moins un paiement existe */}
                          {dernierPai && (
                            <button
                              onClick={() => lancerImpression(c)}
                              className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                              title="Réimprimer le dernier reçu"
                            >
                              <Printer size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientForm
        boutiqueId={id}
        open={formOpen}
        onClose={() => { setFormOpen(false); setClientEdit(null) }}
        onSaved={handleSaved}
        initial={clientEdit}
      />

      <PaiementDialog
        boutiqueId={id}
        client={clientPaiement}
        onClose={() => setClientPaiement(null)}
        onPaid={() => load(search)}
        onPrintReady={({ client, paiement }) => {
          // Mettre à jour l'historique local immédiatement sans attendre reload
          setHistoriquesPaiements(prev => ({ ...prev, [client.id]: paiement }))
        }}
      />

      {/* Zone impression cachée */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
        {recuClient && historiquesPaiements[recuClient.id] && boutiqueActive && (
          <RecuPaiementImprimable
            ref={recuRef}
            client={recuClient}
            boutique={boutiqueActive}
            paiement={historiquesPaiements[recuClient.id]}
            logoBase64={boutiqueActive.logo_base64 ?? null}
          />
        )}
      </div>
    </div>
  )
}