import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { getDashboardBoutique } from '@/api/dashboard'
import { formatMontant, formatDate } from '@/utils/format'
import { toast } from 'sonner'
import KpiCard from './components/KpiCard'
import AccesRapides from './components/AccesRapides'

type DashboardData = {
  aujourd_hui: {
    ca: number
    nb_ventes: number
    recouvrement: number
    encaisse_reel: number
    regle_sur_ventes: number
    avances_deposees: number
    sans_credit: { count: number; montant: number }
    partielles: { count: number; montant_regle: number; montant_credit: number }
    entierement_credit: { count: number; montant: number }
    avec_credit: { count: number; credit_accorde: number }
  }
  mois_en_cours:  { ca: number; nb_ventes: number }
  stock:          { nb_alertes: number; alertes: { variante_id: number; produit: string; stock_actuel: number; seuil_alerte: number }[] }
  dettes_clients: number
  admin: {
    depenses_mois:       number
    retours_mois:        number
    benefice_mois:       number
    cout_achat_mois:     number
    depenses_aujourdhui: number
    retours_aujourdhui:  number
    benefice_aujourdhui: number
    creances_transferts_boutiques: number
    encaisse_transferts_boutiques_aujourdhui: number
    regle_avance_transferts_aujourdhui: number
    solde_avances_boutiques: number
  }
  dernieres_ventes: {
    id: number
    numero_facture: string
    client: string
    vendeur: string
    total_net: number
    date_validation: string
  }[]
}

export default function DashboardAdmin() {
  const { boutiqueId } = useParams()
  const navigate       = useNavigate()
  const id             = Number(boutiqueId)

  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardBoutique(id)
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>
  if (!data)   return null

  const admin = data.admin ?? {
    depenses_mois: 0, retours_mois: 0, benefice_mois: 0, cout_achat_mois: 0,
    depenses_aujourdhui: 0, retours_aujourdhui: 0, benefice_aujourdhui: 0,
    creances_transferts_boutiques: 0,
    encaisse_transferts_boutiques_aujourdhui: 0,
    regle_avance_transferts_aujourdhui:0, solde_avances_boutiques: 0,
  }
  // const benefice    = Number(admin.benefice_mois ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Mois en cours</p>
      </div>

      {/* Ventes du jour — répartition réglées / partielles / à crédit */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-1 mb-4">
          <h3 className="text-sm font-medium text-[#1C1C1C]">Ventes du jour</h3>
          <span
            title="Le CA du jour inclut les ventes à crédit dès leur validation, même non encaissées. Le recouvrement du jour est distinct : il mesure l'argent réellement reçu aujourd'hui, y compris sur des ventes antérieures."
            className="cursor-help"
          >
            <Info size={13} className="text-gray-400" />
          </span>
        </div>

        {/* Décomposition de l'argent réellement rentré */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Réglé comptant sur les ventes du jour</p>
            <p className="text-xl font-semibold text-[#1A7A4A]">
              {formatMontant(Number(data.aujourd_hui?.regle_sur_ventes ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">espèces + mobile money, toutes ventes confondues</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">+ Recouvrement du jour</p>
            <p className="text-xl font-semibold text-[#1A7A4A]">
              {formatMontant(Number(data.aujourd_hui?.recouvrement ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">dettes encaissées, peu importe leur origine</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">+ Avances déposées</p>
              <span title="Argent reçu aujourd'hui comme avance client, pas encore lié à un achat." className="cursor-help">
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#1A7A4A]">
              {formatMontant(Number(data.aujourd_hui?.avances_deposees ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">non lié à une vente pour l'instant</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">Transferts inter-boutiques (à part)</p>
              <span
                title="Argent reçu aujourd'hui d'une autre boutique pour de la marchandise cédée. Cet argent est bien dans la caisse, mais n'est volontairement PAS inclus dans le total ci-dessous, ni dans le CA — c'est un mouvement interne entre boutiques, pas une vente."
                className="cursor-help"
              >
                <Info size={13} className="text-gray-400" />
              </span>
              
            </div>
            <p className="text-xl font-semibold text-[#29ABE2]">
              {formatMontant(Number(admin.encaisse_transferts_boutiques_aujourdhui ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">non inclus dans le total ci-dessous</p>
          </div>
        </div>

        {/* Argent réellement rentré aujourd'hui — mis en avant */}
        <div className="bg-[#D4F0E2] rounded-xl p-4 mb-4 border-2 border-[#1A7A4A]/20">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm text-gray-600 font-medium">Argent réellement rentré aujourd'hui</p>
            <span
              title="Paiements en espèces/mobile money reçus aujourd'hui sur les ventes du jour, recouvrements de dettes (peu importe leur origine), et dépôts d'avance client. C'est le chiffre le plus proche de ce qui est physiquement en caisse."
              className="cursor-help"
            >
              <Info size={13} className="text-gray-400" />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#145C38]">
            {formatMontant(Number(data.aujourd_hui?.encaisse_reel ?? 0))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Réglé sur ventes du jour + recouvrement de dettes + avances déposées.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#D4F0E2] rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Réglées intégralement</p>
            <p className="text-xl font-semibold text-[#1A7A4A]">
              {formatMontant(Number(data.aujourd_hui?.sans_credit?.montant ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.aujourd_hui?.sans_credit?.count ?? 0} vente{(data.aujourd_hui?.sans_credit?.count ?? 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">Montant mis à crédit</p>
              <span
                title="Total du crédit accordé aujourd'hui, toutes ventes confondues (partielles et entièrement à crédit). Voir le détail dans les deux cartes suivantes."
                className="cursor-help"
              >
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#E8314A]">
              {formatMontant(Number(data.aujourd_hui?.avec_credit?.credit_accorde ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.aujourd_hui?.avec_credit?.count ?? 0} vente{(data.aujourd_hui?.avec_credit?.count ?? 0) > 1 ? 's' : ''} concernée{(data.aujourd_hui?.avec_credit?.count ?? 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-gray-500">dont Règlements partiels</p>
              <span
                title="Ventes payées en partie comptant, le reste laissé à crédit."
                className="cursor-help"
              >
                <Info size={13} className="text-gray-400" />
              </span>
            </div>
            <p className="text-xl font-semibold text-[#B45309]">
              {formatMontant(Number(data.aujourd_hui?.partielles?.montant_credit ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.aujourd_hui?.partielles?.count ?? 0} vente{(data.aujourd_hui?.partielles?.count ?? 0) > 1 ? 's' : ''}
              {' — '}{formatMontant(Number(data.aujourd_hui?.partielles?.montant_regle ?? 0))} déjà réglés comptant
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">dont Entièrement à crédit</p>
            <p className="text-xl font-semibold text-[#E8314A]">
              {formatMontant(Number(data.aujourd_hui?.entierement_credit?.montant ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.aujourd_hui?.entierement_credit?.count ?? 0} vente{(data.aujourd_hui?.entierement_credit?.count ?? 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="CA aujourd'hui"
          value={formatMontant(Number(data.aujourd_hui?.ca ?? 0))}
          sub={`${data.aujourd_hui?.nb_ventes ?? 0} vente(s)`}
          color="green"
        />
        <KpiCard
          label="Encaissé aujourd'hui"
          value={formatMontant(Number(data.aujourd_hui?.encaisse_reel ?? 0))}
          sub="ventes + recouvrement + avances"
          color="green"
        />
        <KpiCard
          label="Dépenses du jour"
          value={formatMontant(Number(admin.depenses_aujourdhui ?? 0))}
          color="red"
        />
        <KpiCard
          label="Retours du jour"
          value={formatMontant(Number(admin.retours_aujourdhui ?? 0))}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-sm text-gray-500">Avances des boutiques-clientes (solde)</p>
            <span
              title="Somme des soldes d'avance de tous les clients marqués comme représentant une autre boutique du réseau. Cet argent est disponible pour régler de futurs transferts sans nouvel encaissement."
              className="cursor-help"
            >
              <Info size={13} className="text-gray-400" />
            </span>
          </div>
          <p className="text-xl font-semibold text-[#29ABE2]">
            {formatMontant(Number(admin.solde_avances_boutiques ?? 0))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Bénéfice du jour"
          value={formatMontant(Number(admin.benefice_aujourdhui ?? 0))}
          color={Number(admin.benefice_aujourdhui ?? 0) >= 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="Dettes clients"
          value={formatMontant(Number(data.dettes_clients ?? 0))}
          color="red"
        />
        <KpiCard
          label="Dû par les boutiques"
          value={formatMontant(Number(admin.creances_transferts_boutiques ?? 0))}
          sub="transferts inter-boutiques"
          color={Number(admin.creances_transferts_boutiques ?? 0) > 0 ? 'red' : 'green'}
        />
        <KpiCard
          label="Alertes stock"
          value={data.stock?.nb_alertes ?? 0}
          sub="variantes sous seuil"
          color={data.stock?.nb_alertes > 0 ? 'red' : 'green'}
        />
      </div>


      <AccesRapides boutiqueId={id} role="admin_boutique" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertes stock */}
        {(data.stock?.alertes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#1C1C1C]">Alertes stock</h3>
              <button
                onClick={() => navigate(`/boutiques/${id}/produits`)}
                className="text-xs text-[#1A7A4A] hover:underline flex items-center gap-1"
              >
                Voir produits <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {data.stock.alertes.map(a => (
                <div key={a.variante_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-[#E8314A]" />
                    <span className="text-sm text-[#1C1C1C]">{a.produit}</span>
                  </div>
                  <span className="text-xs text-[#E8314A] font-medium">
                    Stock : {a.stock_actuel} / seuil : {a.seuil_alerte}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dernières ventes */}
        {(data.dernieres_ventes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#1C1C1C]">Dernières ventes</h3>
              <button
                onClick={() => navigate(`/boutiques/${id}/ventes`)}
                className="text-xs text-[#1A7A4A] hover:underline flex items-center gap-1"
              >
                Voir tout <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {data.dernieres_ventes.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-[#1C1C1C] font-mono">{v.numero_facture}</p>
                    <p className="text-xs text-gray-400">{v.client?.trim() || 'Client anonyme'} — {v.vendeur}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#1A7A4A] font-medium">{formatMontant(v.total_net)}</p>
                    <p className="text-xs text-gray-400">{formatDate(v.date_validation)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}