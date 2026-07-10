import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, CreditCard, Printer, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getClients, getDerniersPaiements, getClientStats } from '@/api/clients'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage]                     = useState(1)
  const [lastPage, setLastPage]             = useState(1)
  const [formOpen, setFormOpen]             = useState(false)
  const [clientEdit, setClientEdit]         = useState<Client | null>(null)
  const [clientPaiement, setClientPaiement] = useState<Client | null>(null)
  const [filters, setFilters]               = useState<ClientFilterValues>(defaultFilters)

  // Stats globales (indépendantes de la pagination)
  const [stats, setStats] = useState({ total_clients: 0, avec_dette: 0, total_dettes: 0, recouvrement_jour: 0 })

  const navigate = useNavigate()

  const [historiquesPaiements, setHistoriquesPaiements] =
    useState<Record<number, PaiementHistorique[]>>({})

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

const loadStats = async () => {
    try {
      const res = await getClientStats(id)
      setStats(res.data)
    } catch {
      // silencieux
    }
  }

  
  const loadDerniersPaiements = async (clientIds: number[]) => {
    if (clientIds.length === 0) { setHistoriquesPaiements({}); return }
    try {
      const resPaiements = await getDerniersPaiements(id, clientIds)
      const map: Record<number, PaiementHistorique[]> = {}
      Object.entries(resPaiements.data).forEach(([clientId, p]: [string, unknown]) => {
        const pai = p as Record<string, unknown>
        map[Number(clientId)] = [{
          id:       pai.id       as number,
          montant:  pai.montant  as number,
          mode:     pai.mode     as 'especes' | 'mobile_money',
          date:     pai.date     as string,
          vente_id: pai.vente_id as number,
          vente: {
            numero_facture: pai.numero_facture as string,
            total_net:      pai.total_net      as number,
            solde_restant:  0,
          },
        }]
      })
      setHistoriquesPaiements(map)
    } catch {
      // silencieux
    }
  }

  const loadClients = async (q = '') => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 25, page }
      if (q) params.search = q

      const res  = await getClients(id, params)
      const data = res.data?.data ?? res.data
      const liste: Client[] = Array.isArray(data) ? data : []
      setClients(liste)
      setTotal(res.data?.total ?? liste.length)
      setLastPage(res.data?.last_page ?? 1)
      loadDerniersPaiements(liste.map(c => c.id))
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Chargé une seule fois par boutique
  useEffect(() => {
    loadStats()
  }, [id])

  // Debounce de la recherche : on repart à la page 1 à chaque nouvelle recherche
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Recharge la liste des clients à chaque changement de page ou de recherche
  useEffect(() => {
    loadClients(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, debouncedSearch])


  const clientsFiltres = useMemo(() => clients.filter(c => {
     const dette = Number(c.total_dette ?? 0)
     if (filters.statut === 'avec_dette' && dette <= 0) return false
     if (filters.statut === 'en_regle'   && dette >  0) return false

     if (filters.dateDebut || filters.dateFin) {
       const dernierPai = historiquesPaiements[c.id]?.[0]
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
   }), [clients, filters, historiquesPaiements])

  const handleSaved = (client: Client) => {
    setClients(prev => {
      const existe = prev.findIndex(c => c.id === client.id)
      if (existe >= 0) return prev.map(c => c.id === client.id ? client : c)
      return [client, ...prev]
    })
    setTotal(prev => clientEdit ? prev : prev + 1)
    loadStats() // ← rafraîchir les stats après création
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

      {/* Stats — depuis l'endpoint dédié */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total clients</p>
          <p className="text-3xl text-[#1C1C1C]">{stats.total_clients}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Clients avec dettes</p>
          <p className="text-3xl text-[#E8314A]">{stats.avec_dette}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Créances totales</p>
          <p className="text-3xl text-[#E8314A]">{formatMontant(stats.total_dettes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Recouvrement du jour</p>
          <p className="text-3xl text-[#1A7A4A]">{formatMontant(stats.recouvrement_jour)}</p>
        </div>
      </div>

      {/* Recherche */}
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
          <>
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
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/boutiques/${boutiqueId}/clients/${c.id}`)}
                      className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors cursor-pointer"
                    >
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
                            onClick={e => { e.stopPropagation(); navigate(`/boutiques/${boutiqueId}/clients/${c.id}`) }}
                            className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                            title="Voir le détail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setClientEdit(c); setFormOpen(true) }}
                            className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          {dette > 0 && (
                            <button
                              onClick={e => { e.stopPropagation(); setClientPaiement(c) }}
                              className="text-gray-400 hover:text-[#29ABE2] transition-colors"
                              title="Enregistrer un paiement"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          {dernierPai && (
                            <button
                              onClick={e => { e.stopPropagation(); lancerImpression(c) }}
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

          {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {lastPage} — {total} client{total > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} className="mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                >
                  Suivant
                  <ChevronRight size={15} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
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
        onPaid={() => { loadClients(debouncedSearch); loadStats() }}
        onPrintReady={({ client, paiement }) => {
          setHistoriquesPaiements(prev => ({
            ...prev,
            [client.id]: [paiement, ...(prev[client.id] ?? [])],
          }))
        }}
      />

      {/* Zone impression cachée */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
        {(() => {
          if (!recuClient) return null
          const pai = historiquesPaiements[recuClient.id]?.[0]
          return pai?.vente && boutiqueActive ? (
            <RecuPaiementImprimable
              ref={recuRef}
              client={recuClient}
              boutique={boutiqueActive}
              paiement={{ ...pai, vente: pai.vente }}
              logoBase64={boutiqueActive.logo_base64 ?? null}
            />
          ) : null
        })()}
      </div>
    </div>
  )
}