import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMontant, formatDate } from '@/utils/format'
import { Info } from 'lucide-react'

type CAData = {
  periode: { debut: string; fin: string }
  boutique: { id: number; nom: string }
  ca: { brut: number; retours: number; net: number; total_remises: number; ecart_prix: number }
  couts: { achat: number; marge_brute: number; depenses: number; benefice_net: number }
  ventes: {
    count_validees: number
    count_brouillons: number
    par_mode: Record<string, number>
    sans_credit: { count: number; montant: number }
    partielles: { count: number; montant_regle: number; montant_credit: number }
    entierement_credit: { count: number; montant: number }
    detail: VenteDetail[]
  }
  encaisse: {
    regle_sur_ventes: number
    recouvrement: number
    avances_deposees: number
    total: number
  }
  transferts_boutiques: {
    creances_actuelles: number
    crees_periode: number
    encaisse_periode: number
    regle_avance_periode: number
  }
}

type VenteDetail = {
  id: number
  numero_facture: string | null
  client_nom: string | null
  date_validation: string
  total_net: number
  categorie: 'reglee' | 'partielle' | 'credit_total'
  credit_accorde: number
  cash: number
  rembourse: number
  reste_du: number
}

const MODE_COLORS: Record<string, string> = {
  especes:      '#1A7A4A',
  mobile_money: '#29ABE2',
  credit:       '#E8314A',
}
const MODE_LABELS: Record<string, string> = {
  especes:      'Espèces',
  mobile_money: 'Mobile Money',
  credit:       'Crédit',
}
const CATEGORIE_BADGES: Record<VenteDetail['categorie'], { label: string; className: string }> = {
  reglee:       { label: 'Réglée intégralement', className: 'bg-[#D4F0E2] text-[#145C38]' },
  partielle:    { label: 'Règlement partiel',     className: 'bg-yellow-50 text-[#B45309]' },
  credit_total: { label: 'Entièrement à crédit',  className: 'bg-red-50 text-[#E8314A]' },
}

export default function TabCA({ data }: { data: CAData }) {
  const ca      = data.ca     ?? { brut: 0, retours: 0, net: 0, total_remises: 0, ecart_prix: 0 }
  const couts   = data.couts  ?? { achat: 0, marge_brute: 0, depenses: 0, benefice_net: 0 }
  const ventes  = data.ventes ?? { count_validees: 0, count_brouillons: 0, par_mode: {}, sans_credit: { count: 0, montant: 0 }, partielles: { count: 0, montant_regle: 0, montant_credit: 0 }, entierement_credit: { count: 0, montant: 0 }, detail: [] }
  const encaisse = data.encaisse ?? { regle_sur_ventes: 0, recouvrement: 0, avances_deposees: 0, total: 0 }
  const transferts = data.transferts_boutiques ?? { creances_actuelles: 0, crees_periode: 0, encaisse_periode: 0, regle_avance_periode: 0 }
  const parMode = ventes.par_mode ?? {}

  const pieData = Object.entries(parMode)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name:  MODE_LABELS[key] ?? key,
      value: Number(value),
      color: MODE_COLORS[key] ?? '#999',
    }))

  const kpis = [
    { label: 'CA Net',       value: ca.net,               color: 'text-[#1C1C1C]', bg: 'bg-gray-50'    },
    { label: 'Espèces',      value: parMode.especes ?? 0,      color: 'text-[#1A7A4A]', bg: 'bg-[#D4F0E2]' },
    { label: 'Mobile Money', value: parMode.mobile_money ?? 0, color: 'text-[#29ABE2]', bg: 'bg-blue-50'   },
    { label: 'Crédit',       value: parMode.credit ?? 0,       color: 'text-[#E8314A]', bg: 'bg-red-50'    },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">{k.label}</p>
              {k.label === 'Crédit' && (
                <span
                  title="Montant vendu à crédit sur la période. Ne diminue pas après un remboursement — c'est le solde dû (onglet Dettes) qui reflète les paiements reçus."
                  className="cursor-help"
                >
                  <Info size={13} className="text-gray-400" />
                </span>
              )}
            </div>
            <p className={`text-xl font-semibold ${k.color}`}>{formatMontant(Number(k.value ?? 0))}</p>
          </div>
        ))}
      </div>

      {Number(parMode.credit ?? 0) > 0 && (
        <p className="text-xs text-gray-400 -mt-2 flex items-center gap-1">
          <Info size={12} className="shrink-0" />
          Le crédit correspond aux ventes réalisées à crédit sur cette période — il n'inclut pas les remboursements reçus depuis. Le montant restant dû est visible dans l'onglet « Dettes ».
        </p>
      )}

      {/* Répartition Réglées / Partielles / Entièrement à crédit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition des ventes de la période</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#D4F0E2] rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Réglées intégralement</p>
            <p className="text-xl font-semibold text-[#1A7A4A]">{formatMontant(ventes.sans_credit.montant)}</p>
            <p className="text-xs text-gray-400 mt-1">{ventes.sans_credit.count} vente{ventes.sans_credit.count > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">Montant mis à crédit</p>
              <span title="Total du crédit accordé sur la période, partiel ou total." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#E8314A]">
              {formatMontant(ventes.partielles.montant_credit + ventes.entierement_credit.montant)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {ventes.partielles.count + ventes.entierement_credit.count} vente{(ventes.partielles.count + ventes.entierement_credit.count) > 1 ? 's' : ''} concernée{(ventes.partielles.count + ventes.entierement_credit.count) > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">dont Règlements partiels</p>
              <span title="Ventes payées en partie comptant, le reste laissé à crédit." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#B45309]">{formatMontant(ventes.partielles.montant_credit)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {ventes.partielles.count} vente{ventes.partielles.count > 1 ? 's' : ''} — {formatMontant(ventes.partielles.montant_regle)} déjà réglés comptant
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">dont Entièrement à crédit</p>
            <p className="text-xl font-semibold text-[#E8314A]">{formatMontant(ventes.entierement_credit.montant)}</p>
            <p className="text-xs text-gray-400 mt-1">{ventes.entierement_credit.count} vente{ventes.entierement_credit.count > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Argent réellement encaissé */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Argent réellement encaissé sur la période</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Réglé comptant sur les ventes</p>
            <p className="text-lg font-semibold text-[#1A7A4A]">{formatMontant(encaisse.regle_sur_ventes)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">+ Recouvrement de dettes</p>
            <p className="text-lg font-semibold text-[#1A7A4A]">{formatMontant(encaisse.recouvrement)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">+ Avances déposées</p>
              <span title="Dépôts d'avance de clients particuliers (hors boutiques du réseau) sur la période." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-lg font-semibold text-[#1A7A4A]">{formatMontant(encaisse.avances_deposees)}</p>
          </div>
        </div>
        <div className="bg-[#D4F0E2] rounded-xl p-4 border-2 border-[#1A7A4A]/20">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm text-gray-600 font-medium">Total encaissé sur la période</p>
            <span
              title="Paiements en espèces/mobile money reçus sur les ventes, recouvrements de dettes et dépôts d'avance sur cette période. C'est le chiffre le plus proche de ce qui est physiquement entré en caisse."
              className="cursor-help"
            >
              <Info size={13} className="text-gray-400" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#145C38]">{formatMontant(encaisse.total)}</p>
          <p className="text-xs text-gray-500 mt-1">Le CA net ({formatMontant(ca.net)}) ne suffit pas à répondre à cette question à lui seul.</p>
        </div>
      </div>

      {/* Transferts inter-boutiques */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Transferts inter-boutiques</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">Dû par les boutiques (actuel)</p>
              <span title="Solde total dû par les autres boutiques du réseau, à l'instant présent — indépendant de la période choisie." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-lg font-semibold text-[#29ABE2]">{formatMontant(transferts.creances_actuelles)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Transferts créés sur la période</p>
            <p className="text-lg font-semibold text-gray-800">{formatMontant(transferts.crees_periode)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Encaissé sur la période</p>
            <p className="text-lg font-semibold text-[#1A7A4A]">{formatMontant(transferts.encaisse_periode)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">dont réglé via avance</p>
              <span title="Déjà en caisse au moment du dépôt de l'avance — pas un nouvel encaissement de cette période." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-500">{formatMontant(transferts.regle_avance_periode)}</p>
          </div>
        </div>
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">CA Brut</p>
          <p className="text-lg text-[#1C1C1C]">{formatMontant(ca.brut)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Retours</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.retours)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Remises</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.total_remises)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Écart prix</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(ca.ecart_prix)}</p>
        </div>
      </div>

      {/* Marges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Coût achats</p>
          <p className="text-lg text-[#1C1C1C]">{formatMontant(couts.achat)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Marge brute</p>
          <p className={`text-lg ${couts.marge_brute >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]'}`}>
            {formatMontant(couts.marge_brute)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Dépenses</p>
          <p className="text-lg text-[#E8314A]">- {formatMontant(couts.depenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Bénéfice net</p>
          <p className={`text-lg font-semibold ${couts.benefice_net >= 0 ? 'text-[#1A7A4A]' : 'text-[#E8314A]'}`}>
            {formatMontant(couts.benefice_net)}
          </p>
        </div>
      </div>

      {/* Ventes count */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Ventes validées</p>
          <p className="text-2xl text-[#1A7A4A]">{ventes.count_validees}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Brouillons en cours</p>
          <p className="text-2xl text-gray-400">{ventes.count_brouillons}</p>
        </div>
      </div>

      {/* Graphique */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm text-gray-500 mb-4">Répartition par mode de paiement</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatMontant(Number(v ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Liste détaillée des ventes de la période */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Détail des ventes de la période</h3>
        </div>
        {ventes.detail.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucune vente sur cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Facture</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Statut</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Total</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Solde dû (actuel)</th>
                </tr>
              </thead>
              <tbody>
                {ventes.detail.map(v => {
                  const badge = CATEGORIE_BADGES[v.categorie]
                  return (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-2.5 px-4 text-sm text-gray-600">{formatDate(v.date_validation)}</td>
                      <td className="py-2.5 px-4 text-sm font-mono text-gray-600">{v.numero_facture ?? '—'}</td>
                      <td className="py-2.5 px-4 text-sm text-gray-700">{v.client_nom ?? <span className="text-gray-300">Anonyme</span>}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-sm font-medium text-gray-900 text-right">{formatMontant(v.total_net)}</td>
                      <td className="py-2.5 px-4 text-sm text-right">
                        {v.reste_du > 0
                          ? <span className="text-[#E8314A] font-medium">{formatMontant(v.reste_du)}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}