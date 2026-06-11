// src/pages/approvisionnements/ApprovisionnementDetailPage.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useReactToPrint } from 'react-to-print'
import { getApprovisionnement, type Approvisionnement } from '@/api/approvisionnements'
import { useBoutique } from '@/hooks/useBoutique'
import { formatDate, formatMontant } from '@/utils/format'
import RecuApprovisionnement from './components/RecuApprovisionnement'

export default function ApprovisionnementDetailPage() {
  const { boutiqueId, approId } = useParams()
  const navigate                 = useNavigate()
  const { boutiqueActive }       = useBoutique()
  const id                       = Number(boutiqueId)

  const [appro,   setAppro]   = useState<Approvisionnement | null>(null)
  const [loading, setLoading] = useState(true)
  const recuRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getApprovisionnement(id, Number(approId))
      .then(res => setAppro(res.data))
      .finally(() => setLoading(false))
  }, [approId])

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; -webkit-print-color-adjust: exact; }`,
  })

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>
  if (!appro)  return <div className="text-center py-16 text-gray-400">Approvisionnement introuvable</div>

  const totalGeneral = appro.lignes.reduce((s, l) => s + Number(l.prix_achat) * l.quantite, 0)

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/boutiques/${id}/approvisionnements`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl text-[#1C1C1C]">{appro.reference}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(appro.created_at)}</p>
          </div>
        </div>
        <Button
          onClick={() => handlePrint()}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Printer size={16} className="mr-2" />
          Imprimer le reçu
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total articles</p>
          <p className="text-lg font-medium text-gray-900">
            {appro.lignes.length} article{appro.lignes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
          <p className="text-lg font-medium text-[#1A7A4A]">{formatMontant(totalGeneral)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Enregistré par</p>
          <p className="text-lg font-medium text-gray-900">
            {appro.user.prenom} {appro.user.nom}
          </p>
        </div>
      </div>

      {/* Fournisseur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>
        <Separator />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Nom : </span>
            <span className="font-medium">{appro.fournisseur.nom}</span>
          </div>
          {appro.fournisseur.telephone && (
            <div>
              <span className="text-gray-500">Tél : </span>
              {appro.fournisseur.telephone}
            </div>
          )}
          {appro.fournisseur.provenance && (
            <div>
              <span className="text-gray-500">Provenance : </span>
              {appro.fournisseur.provenance}
            </div>
          )}
          {appro.fournisseur.adresse && (
            <div>
              <span className="text-gray-500">Adresse : </span>
              {appro.fournisseur.adresse}
            </div>
          )}
        </div>
      </div>

      {/* Lignes produits */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 pb-3">
          <h2 className="text-base font-medium text-gray-800">Produits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Produit</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Quantité</th>
                <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Prix achat</th>
                <th className="text-right py-3 px-4 text-sm text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {appro.lignes.map((l, i) => {
                const designation = l.variante?.produit?.designation ?? '—'
                const attributs   = l.variante?.attributs && Object.keys(l.variante.attributs).length > 0
                  ? Object.values(l.variante.attributs).join(' / ') : ''
                const label = attributs ? `${designation} (${attributs})` : designation
                const total = Number(l.prix_achat) * l.quantite

                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">{label}</td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-400">
                      {l.variante?.produit?.reference ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{l.quantite}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {formatMontant(Number(l.prix_achat))}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#1A7A4A] text-right">
                      {formatMontant(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-right text-gray-700">
                  Total général
                </td>
                <td className="py-3 px-4 font-bold text-[#1A7A4A] text-right">
                  {formatMontant(totalGeneral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Note */}
      {appro.note && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
          <h2 className="text-base font-medium text-gray-800">Note</h2>
          <Separator />
          <p className="text-sm text-gray-600">{appro.note}</p>
        </div>
      )}

      {/* Reçu monté en arrière-plan */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
        {appro && boutiqueActive && (
          <RecuApprovisionnement
            ref={recuRef}
            appro={appro}
            boutique={boutiqueActive}
            logoBase64={boutiqueActive.logo_base64 ?? null}
          />
        )}
      </div>

    </div>
  )
}