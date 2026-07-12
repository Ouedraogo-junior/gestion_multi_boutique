import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Info, ChevronRight, ChevronLeft, ShoppingBag, FileText, Wallet, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getVentesStats } from '@/api/ventes'
import type { VenteStats } from '@/api/ventes'
import { getActivites } from '@/api/activites'
import type { ActiviteItem } from '@/api/activites'
import { formatMontant, formatDate } from '@/utils/format'

const MODE_LABELS: Record<string, string> = {
  especes:      'espèces',
  mobile_money: 'mobile money',
}

const TYPE_BADGES: Record<ActiviteItem['type'], { icon: typeof ShoppingBag; label: string; className: string }> = {
  vente:                   { icon: ShoppingBag,  label: 'Vente',                     className: 'bg-gray-100 text-gray-600' },
  dette_initiale:          { icon: FileText,     label: 'Dette antérieure ajoutée',  className: 'bg-red-50 text-[#E8314A]' },
  paiement_vente:          { icon: Wallet,       label: 'Remboursement vente',       className: 'bg-[#D4F0E2] text-[#145C38]' },
  paiement_dette_initiale: { icon: ReceiptText,  label: 'Remboursement dette antérieure', className: 'bg-[#D4F0E2] text-[#145C38]' },
}

function getExplication(item: ActiviteItem): string {
  switch (item.type) {
    case 'vente': {
      const { montant, categorie, cash = 0, credit_accorde = 0, rembourse = 0, reste_du = 0 } = item
      if (categorie === 'reglee') {
        return `Payée intégralement (${formatMontant(montant)}) au moment de la vente. Cet argent est déjà en caisse.`
      }
      if (categorie === 'partielle') {
        let txt = `${formatMontant(cash)} payés comptant, ${formatMontant(credit_accorde)} laissés à crédit.`
        if (rembourse > 0) txt += ` ${formatMontant(rembourse)} remboursés depuis.`
        txt += reste_du > 0 ? ` Il reste ${formatMontant(reste_du)} dû.` : ` Dette entièrement soldée.`
        return txt
      }
      let txt = `Vente entièrement à crédit (${formatMontant(credit_accorde)}), aucun paiement immédiat.`
      if (rembourse > 0) txt += ` ${formatMontant(rembourse)} remboursés depuis.`
      txt += reste_du > 0 ? ` Il reste ${formatMontant(reste_du)} dû.` : ` Dette entièrement soldée.`
      return txt
    }
    case 'dette_initiale': {
      const { montant, note, reste_du = 0 } = item
      let txt = `Dette antérieure au système enregistrée pour ${formatMontant(montant)}${note ? ' — ' + note : ''}.`
      txt += reste_du > 0 ? ` Solde actuel : ${formatMontant(reste_du)} dû.` : ` Entièrement remboursée depuis.`
      return txt
    }
    case 'paiement_vente':
      return `Remboursement de ${formatMontant(item.montant)} reçu (${MODE_LABELS[item.mode ?? ''] ?? item.mode}) sur la facture ${item.numero_facture}.`
    case 'paiement_dette_initiale':
      return `Remboursement de ${formatMontant(item.montant)} reçu (${MODE_LABELS[item.mode ?? ''] ?? item.mode}) sur une dette antérieure.`
    default:
      return ''
  }
}

export default function ActivitesPage() {
  const { boutiqueId } = useParams()
  const navigate = useNavigate()
  const id = Number(boutiqueId)

  const today    = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [debut, setDebut]         = useState(firstDay)
  const [fin, setFin]             = useState(today)
  const [items, setItems]         = useState<ActiviteItem[]>([])
  const [stats, setStats]         = useState<VenteStats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [lastPage, setLastPage]   = useState(1)
  const [refresh, setRefresh]     = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getActivites(id, { debut, fin, per_page: 25, page }),
      getVentesStats(id, { debut, fin }),
    ])
      .then(([resActivites, resStats]) => {
        setItems(resActivites.data.data ?? [])
        setLastPage(resActivites.data.last_page ?? 1)
        setStats(resStats.data)
      })
      .finally(() => setLoading(false))
  }, [id, page, refresh])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Activités</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ventes, dettes antérieures et remboursements — le détail de chaque mouvement et pourquoi il compte
        </p>
      </div>

      {/* Période */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-sm text-gray-500">Du</Label>
            <Input type="date" value={debut} onChange={e => setDebut(e.target.value)} className="border-gray-200 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-gray-500">Au</Label>
            <Input type="date" value={fin} onChange={e => setFin(e.target.value)} className="border-gray-200 w-40" />
          </div>
          <Button onClick={() => { setPage(1); setRefresh(n => n + 1) }} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs résumés de la période (ventes uniquement) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">CA total</p>
            <p className="text-xl font-semibold text-[#1C1C1C]">{formatMontant(stats.ca_total)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.total_ventes_validees} vente{stats.total_ventes_validees > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-[#D4F0E2] rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Réglées intégralement</p>
            <p className="text-xl font-semibold text-[#1A7A4A]">{formatMontant(stats.sans_credit.montant)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.sans_credit.count} vente{stats.sans_credit.count > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">Montant mis à crédit</p>
              <span title="Total du crédit accordé sur la période, partiel ou total." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#E8314A]">{formatMontant(stats.avec_credit.credit_accorde)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.avec_credit.count} vente{stats.avec_credit.count > 1 ? 's' : ''} concernée{stats.avec_credit.count > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Reste dû (à ce jour)</p>
            <p className="text-xl font-semibold text-[#E8314A]">{formatMontant(stats.avec_credit.reste_du)}</p>
            <p className="text-xs text-gray-400 mt-1">sur les ventes de la période</p>
          </div>
        </div>
      )}

      {/* Timeline unifiée */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune activité sur cette période</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {items.map(item => {
                const badge = TYPE_BADGES[item.type]
                const Icon = badge.icon
                const clickable = item.type === 'vente'
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => clickable && navigate(`/boutiques/${id}/ventes/${item.id}`)}
                    className={`p-4 transition-colors ${clickable ? 'hover:bg-[#F4F6F5] cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} className="text-gray-400 shrink-0" />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                          {item.numero_facture && (
                            <span className="text-xs font-mono text-gray-400">{item.numero_facture}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {formatDate(item.date)}
                          {item.client_nom && ` · ${item.client_nom}`}
                        </p>
                        <p className="text-sm text-gray-600">{getExplication(item)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-semibold text-gray-900">{formatMontant(item.montant)}</p>
                        {item.type === 'vente' && (item.reste_du ?? 0) > 0 && (
                          <p className="text-xs text-[#E8314A] font-medium mt-1">{formatMontant(item.reste_du!)} dû</p>
                        )}
                        {clickable && <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} sur {lastPage}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-200" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft size={15} className="mr-1" /> Précédent
                </Button>
                <Button variant="outline" size="sm" className="border-gray-200" disabled={page >= lastPage} onClick={() => setPage(p => Math.min(lastPage, p + 1))}>
                  Suivant <ChevronRight size={15} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}