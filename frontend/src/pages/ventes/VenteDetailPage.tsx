// src/pages/ventes/VenteDetailPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, Printer, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVente, annulerVente } from '@/api/ventes'
import type { Vente } from '@/api/ventes'
import { useBoutique } from '@/hooks/useBoutique'
import { useAuth } from '@/hooks/useAuth'
import { formatMontant, formatDate } from '@/utils/format'
import { ROLES } from '@/utils/constants'
import { toast } from 'sonner'
import RecuImprimable from './components/RecuImprimable'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const STATUT = {
  brouillon: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  validee:   { label: 'Validée',   className: 'bg-[#D4F0E2] text-[#145C38]' },
  annulee:   { label: 'Annulée',   className: 'bg-red-50 text-[#E8314A]' },
}

const MODE_LABELS: Record<string, string> = {
  especes:       'Espèces',
  mobile_money:  'Mobile Money',
  avance_client: 'Avance client',
  credit:        'Crédit',
}

export default function VenteDetailPage() {
  const { boutiqueId, vid } = useParams()
  const navigate             = useNavigate()
  const { boutiqueActive }   = useBoutique()
  const { user }             = useAuth()
  const id                   = Number(boutiqueId)
  const venteId              = Number(vid)
  const recuRef              = useRef<HTMLDivElement>(null)

  const [vente, setVente]               = useState<Vente | null>(null)
  const [loading, setLoading]           = useState(true)
  const [confirmAnnuler, setConfirmAnnuler] = useState(false)

  const isAdmin = user?.role === ROLES.ADMIN_BOUTIQUE || user?.role === ROLES.SUPER_ADMIN


  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 0; } @media print { body { margin: 0; } }`,
  })

  useEffect(() => {
    getVente(id, venteId)
      .then(res => setVente(res.data))
      .catch(() => toast.error('Vente introuvable'))
      .finally(() => setLoading(false))
  }, [id, venteId])

  const handleAnnuler = async () => {
    if (!vente) return
    try {
      await annulerVente(id, vente.id)
      toast.success('Vente annulée')
      setVente(prev => prev ? { ...prev, statut: 'annulee' } : prev)
      setConfirmAnnuler(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'annulation')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement...</div>
  if (!vente)  return <div className="text-center py-20 text-gray-400">Vente introuvable</div>

  const statut       = STATUT[vente.statut]
  //const totalEspeces = vente.paiements?.filter(p => p.mode === 'especes').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  //const totalMM      = vente.paiements?.filter(p => p.mode === 'mobile_money').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  const totalCredit  = vente.paiements?.filter(p => p.mode === 'credit').reduce((s, p) => s + Number(p.montant), 0) ?? 0
  const nomClient    = vente.client ? [vente.client.prenom, vente.client.nom].filter(Boolean).join(' ') : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/boutiques/${id}/ventes`)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl text-[#1C1C1C]">
                {vente.numero_facture ?? 'Brouillon'}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statut.className}`}>
                {statut.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {formatDate(vente.date_validation ?? vente.created_at)}
              {' · '}
              {vente.vendeur?.prenom} {vente.vendeur?.nom}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {vente.statut === 'validee' && boutiqueActive && (
            <Button
              onClick={() => handlePrint()}
              variant="outline"
              className="border-gray-200"
            >
              <Printer size={16} className="mr-2" />
              Imprimer
            </Button>
          )}
          {isAdmin && vente.statut === 'validee' && (
            <Button
              onClick={() => setConfirmAnnuler(true)}
              variant="outline"
              className="border-red-100 text-[#E8314A] hover:bg-red-50"
            >
              <XCircle size={16} className="mr-2" />
              Annuler la vente
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lignes de vente */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-medium text-gray-800">Articles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Désignation</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Qté</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">P. Catalogue</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">P. Appliqué</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Remise</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vente.details?.map((d, i) => {
                    const designation = d.variante?.produit?.designation ?? '—'
                    const attributs   = d.variante?.attributs && Object.keys(d.variante.attributs).length > 0
                      ? Object.values(d.variante.attributs).join(' / ')
                      : null
                    const ecart = d.prix_catalogue - d.prix_applique
                    const total = d.prix_applique * d.quantite - d.remise_montant

                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">
                          {designation}
                          {attributs && <span className="block text-xs text-gray-400">{attributs}</span>}
                          {ecart > 0 && (
                            <span className="block text-xs text-[#E8314A]">
                              Remise prix : -{formatMontant(ecart)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">{d.quantite}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-400">{formatMontant(d.prix_catalogue)}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-700">{formatMontant(d.prix_applique)}</td>
                        <td className="py-3 px-4 text-sm text-right text-[#E8314A]">
                          {d.remise_montant > 0 ? `- ${formatMontant(d.remise_montant)}` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">{formatMontant(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={5} className="py-3 px-4 text-sm text-right text-gray-500">Total brut</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{formatMontant(vente.total_brut)}</td>
                  </tr>
                  {vente.total_remise > 0 && (
                    <tr>
                      <td colSpan={5} className="py-2 px-4 text-sm text-right text-[#E8314A]">Remise</td>
                      <td className="py-2 px-4 text-sm text-right text-[#E8314A]">- {formatMontant(vente.total_remise)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-gray-500 text-right font-medium">Total net</td>
                    <td className="py-3 px-4 text-black-500 text-right font-semibold text-[#1A7A4A]">{formatMontant(vente.total_net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar — infos */}
        <div className="space-y-4">
          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Client</h3>
            {nomClient
              ? <p className="text-gray-900 font-medium">{nomClient}</p>
              : <p className="text-gray-300 text-sm">Anonyme</p>
            }
          </div>

          {/* Paiements */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Paiement</h3>
            <div className="space-y-2">
              {vente.paiements?.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={p.mode === 'credit' ? 'text-[#E8314A]' : 'text-gray-600'}>
                    {MODE_LABELS[p.mode]}
                  </span>
                  <span className={`font-medium ${p.mode === 'credit' ? 'text-[#E8314A]' : 'text-gray-900'}`}>
                    {formatMontant(Number(p.montant))}
                  </span>
                </div>
              ))}
            </div>

            {totalCredit > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm font-medium text-[#E8314A]">
                  <span>Reste à payer</span>
                  <span>{formatMontant(totalCredit)}</span>
                </div>
              </div>
            )}

            {totalCredit === 0 && vente.statut === 'validee' && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#D4F0E2] text-[#145C38] font-medium">
                  Entièrement réglé
                </span>
              </div>
            )}
          </div>

          {/* Note */}
          {vente.note && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Note</h3>
              <p className="text-sm text-gray-700">{vente.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reçu caché pour impression */}
      {vente.statut === 'validee' && boutiqueActive && (
        <div className="hidden">
          <RecuImprimable ref={recuRef} vente={vente} boutique={boutiqueActive} logoBase64={boutiqueActive.logo_base64 ?? null} />
        </div>
      )}

      {/* Dialog annulation */}
      <AlertDialog open={confirmAnnuler} onOpenChange={setConfirmAnnuler}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              La vente {vente.numero_facture} sera annulée et le stock réintégré. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnnuler} className="bg-[#E8314A] hover:bg-red-700 text-white">
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}