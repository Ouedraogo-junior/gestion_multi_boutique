import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, Printer, User, Phone, MapPin,
  FileText, ChevronRight, Loader2, Wallet
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import { getClient, getDettes, getPaiements, getAvances } from '@/api/clients'
import type { Client, Dette, PaiementHistorique, AvanceEntry } from '@/api/clients'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { useBoutique } from '@/hooks/useBoutique'
import PaiementDialog from './components/PaiementDialog'
import AvanceDialog from './components/AvanceDialog'
import RecuPaiementImprimable from './components/RecuPaiementImprimable'

export default function ClientDetailPage() {
  const { boutiqueId, clientId } = useParams()
  const navigate = useNavigate()
  const boutiqueIdNum = Number(boutiqueId)
  const clientIdNum   = Number(clientId)
  const { boutiqueActive } = useBoutique()

  const [client,    setClient]    = useState<Client | null>(null)
  const [dettes,    setDettes]    = useState<Dette[]>([])
  const [paiements, setPaiements] = useState<PaiementHistorique[]>([])
  const [totalDette, setTotalDette] = useState(0)
  const [loading,   setLoading]   = useState(true)

  // Avances
  const [soldeAvance, setSoldeAvance]           = useState(0)
  const [avances, setAvances]                   = useState<AvanceEntry[]>([])
  const [avanceDialogOpen, setAvanceDialogOpen] = useState(false)

  const [paiementOpen, setPaiementOpen] = useState(false)
  const [dernierPaiement, setDernierPaiement] = useState<{
    montant: number
    mode: 'especes' | 'mobile_money'
    date: string
    vente: { numero_facture: string; total_net: number; solde_restant: number }
  } | null>(null)

  const recuRef = useRef<HTMLDivElement>(null)
  const [recuReady, setRecuReady] = useState(false)

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; }`,
    onAfterPrint: () => setRecuReady(false),
  })

  const lancerImpression = () => {
    setRecuReady(true)
    setTimeout(() => handlePrint(), 100)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [resClient, resDettes, resPaiements, resAvances] = await Promise.all([
        getClient(boutiqueIdNum, clientIdNum),
        getDettes(boutiqueIdNum, clientIdNum),
        getPaiements(boutiqueIdNum, clientIdNum),
        getAvances(boutiqueIdNum, clientIdNum),
      ])
      setClient(resClient.data)
      setDettes(resDettes.data.dettes ?? [])
      setTotalDette(resDettes.data.total_dette ?? 0)
      const liste: PaiementHistorique[] = resPaiements.data ?? []
      setPaiements(liste)
      const avecVente = liste.find(p => p.vente !== undefined)
      if (avecVente?.vente) setDernierPaiement(avecVente as typeof dernierPaiement extends null ? never : NonNullable<typeof dernierPaiement>)

      setSoldeAvance(resAvances.data.solde_avance ?? 0)
      setAvances(resAvances.data.historique ?? [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [boutiqueIdNum, clientIdNum])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" />
        Chargement...
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-24 text-gray-400">Client introuvable.</div>
    )
  }

  const nomComplet = [client.prenom, client.nom].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">

      {/* Bouton retour */}
      <button
        onClick={() => navigate(`/boutiques/${boutiqueId}/clients`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A7A4A] transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux clients
      </button>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#D4F0E2] flex items-center justify-center shrink-0">
            <User size={22} className="text-[#1A7A4A]" />
          </div>
          <div>
            <h1 className="text-2xl text-[#1C1C1C]">{nomComplet}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              {client.telephone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} />
                  {client.telephone}
                </span>
              )}
              {client.adresse && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {client.adresse}
                </span>
              )}
            </div>
            {client.notes && (
              <p className="text-xs text-gray-400 mt-1 italic">{client.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dernierPaiement && (
            <Button
              variant="outline"
              size="sm"
              onClick={lancerImpression}
              className="border-gray-200 text-gray-600 hover:text-[#1A7A4A]"
            >
              <Printer size={15} className="mr-1.5" />
              Dernier reçu
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAvanceDialogOpen(true)}
            className="border-gray-200 text-gray-600 hover:text-[#1A7A4A]"
          >
            <Wallet size={15} className="mr-1.5" />
            Ajouter une avance
          </Button>
          {totalDette > 0 && (
            <Button
              size="sm"
              onClick={() => setPaiementOpen(true)}
              className="bg-[#29ABE2] hover:bg-[#1A8EC4] text-white"
            >
              <CreditCard size={15} className="mr-1.5" />
              Enregistrer un paiement
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total achats</p>
          <p className="text-2xl text-[#1C1C1C]">{formatMontant(Number(client.total_achat ?? 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total payé</p>
          <p className="text-2xl text-[#1A7A4A]">{formatMontant(Number(client.total_paye ?? 0))}</p>
        </div>
        <div className={`rounded-xl border p-5 ${totalDette > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Créances restantes</p>
          <p className={`text-2xl ${totalDette > 0 ? 'text-[#E8314A]' : 'text-[#1A7A4A]'}`}>
            {formatMontant(totalDette)}
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${soldeAvance > 0 ? 'bg-[#D4F0E2] border-[#1A7A4A]/20' : 'bg-white border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solde d'avance</p>
          <p className={`text-2xl ${soldeAvance > 0 ? 'text-[#145C38]' : 'text-gray-300'}`}>
            {formatMontant(soldeAvance)}
          </p>
        </div>
      </div>

      {/* Ventes à crédit */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-[#1C1C1C]">Ventes à crédit</h2>
        </div>
        {dettes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucune vente à crédit en cours
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Facture</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Total vente</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Montant crédit</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Déjà payé</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Solde restant</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {dettes.map(d => (
                  <tr key={d.vente_id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-5">
                      <span className="text-sm font-medium text-[#1C1C1C]">
                        {d.numero_facture ?? `#${d.vente_id}`}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-sm text-gray-500">
                      {d.date_validation ? formatDate(d.date_validation) : '—'}
                    </td>
                    <td className="py-3 px-5 text-sm text-gray-700 text-right">
                      {formatMontant(Number(d.total_net))}
                    </td>
                    <td className="py-3 px-5 text-sm text-gray-700 text-right">
                      {formatMontant(Number(d.total_credit))}
                    </td>
                    <td className="py-3 px-5 text-sm text-[#1A7A4A] text-right">
                      {formatMontant(Number(d.total_paye))}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="text-sm font-medium text-[#E8314A]">
                        {formatMontant(Number(d.solde_restant))}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <Link
                        to={`/boutiques/${boutiqueId}/ventes/${d.vente_id}`}
                        className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                        title="Voir la vente"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique des avances */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#1C1C1C]">Avances (dépôts et utilisations)</h2>
          <span className="text-xs text-gray-400">
            Solde disponible : <span className="text-[#145C38] font-medium">{formatMontant(soldeAvance)}</span>
          </span>
        </div>
        {avances.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucune avance enregistrée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Type</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Mode / Facture liée</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {avances.map(a => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-5 text-sm text-gray-600">
                      {a.created_at ? formatDate(a.created_at) : '—'}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        a.type === 'depot'
                          ? 'bg-[#D4F0E2] text-[#145C38]'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.type === 'depot' ? 'Dépôt' : 'Utilisation'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      {a.type === 'depot' ? (
                        <span className="text-sm text-gray-600">
                          {a.mode_depot === 'especes' ? 'Espèces' : 'Mobile Money'}
                        </span>
                      ) : a.vente?.numero_facture ? (
                        <Link
                          to={`/boutiques/${boutiqueId}/ventes/${a.vente_id}`}
                          className="text-sm text-[#1A7A4A] hover:underline flex items-center gap-1"
                        >
                          <FileText size={13} />
                          {a.vente.numero_facture}
                        </Link>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className={`py-3 px-5 text-sm text-right font-medium ${
                      a.type === 'depot' ? 'text-[#1A7A4A]' : 'text-gray-500'
                    }`}>
                      {a.type === 'depot' ? '+' : '−'}{formatMontant(a.montant)}
                    </td>
                    <td className="py-3 px-5 text-sm text-gray-400 italic">
                      {a.note ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique paiements */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-[#1C1C1C]">Historique des paiements</h2>
        </div>
        {paiements.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun paiement enregistré
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Facture liée</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Mode</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium">Montant</th>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-5 text-sm text-gray-600">
                      {p.date ? formatDate(p.date) : '—'}
                    </td>
                    <td className="py-3 px-5">
                      {p.vente?.numero_facture ? (
                        <Link
                          to={`/boutiques/${boutiqueId}/ventes/${p.vente_id}`}
                          className="text-sm text-[#1A7A4A] hover:underline flex items-center gap-1"
                        >
                          <FileText size={13} />
                          {p.vente.numero_facture}
                        </Link>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.mode === 'especes'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-50 text-[#29ABE2]'
                      }`}>
                        {p.mode === 'especes' ? 'Espèces' : 'Mobile Money'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-sm font-medium text-[#1A7A4A] text-right">
                      {formatMontant(Number(p.montant))}
                    </td>
                    <td className="py-3 px-5 text-sm text-gray-400 italic">
                      {p.note ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PaiementDialog réutilisé */}
      <PaiementDialog
        boutiqueId={boutiqueIdNum}
        client={paiementOpen ? client : null}
        onClose={() => {
          setPaiementOpen(false)
          load()  // ← recharger après fermeture complète
        }}
        onPaid={() => {
          // Ne pas appeler load() ici — laisser le dialog gérer l'impression d'abord
        }}
        onPrintReady={({ paiement }) => {
          setDernierPaiement(paiement)
        }}
      />

      <AvanceDialog
        boutiqueId={boutiqueIdNum}
        client={avanceDialogOpen ? client : null}
        onClose={() => { setAvanceDialogOpen(false); load() }}
      />

      {/* Zone impression cachée */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
        {recuReady && dernierPaiement && boutiqueActive && (
          <RecuPaiementImprimable
            ref={recuRef}
            client={client}
            boutique={boutiqueActive}
            paiement={dernierPaiement}
            logoBase64={boutiqueActive.logo_base64 ?? null}
          />
        )}
      </div>
    </div>
  )
}