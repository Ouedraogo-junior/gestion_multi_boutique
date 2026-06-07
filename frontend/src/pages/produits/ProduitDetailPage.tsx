import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { getProduit } from '@/api/produits'
import type { Produit } from '@/api/produits'
import { formatMontant } from '@/utils/format'
import StockBadge from './components/StockBadge'
import EntreeStockForm from './components/EntreeStockForm'

export default function ProduitDetailPage() {
  const { boutiqueId, produitId } = useParams()
  const navigate                   = useNavigate()
  const id                         = Number(boutiqueId)

  const [produit, setProduit]       = useState<Produit | null>(null)
  const [stockDialog, setStockDialog] = useState(false)
  const [loading, setLoading]       = useState(true)

  const load = async () => {
    const res = await getProduit(id, Number(produitId))
    const data = res.data.data ?? res.data
    setProduit(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [produitId])

  if (loading) return <div className="text-center py-16 text-gray-400">Chargement...</div>
  if (!produit) return <div className="text-center py-16 text-gray-400">Produit introuvable</div>

  const totalStock = produit.variantes?.reduce((s, v) => s + v.stock_actuel, 0) ?? 0
  const totalSeuil = produit.variantes?.reduce((s, v) => s + v.seuil_alerte, 0) ?? produit.seuil_alerte

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/boutiques/${id}/produits`)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl text-[#1C1C1C]">{produit.designation}</h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{produit.reference}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStockDialog(true)}
            className="border-gray-200"
          >
            <PackagePlus size={16} className="mr-1.5" />
            Entrée stock
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/boutiques/${id}/produits/${produit.id}/modifier`)}
            className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            <Pencil size={16} className="mr-1.5" />
            Modifier
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Prix achat</p>
          <p className="text-lg font-medium text-gray-900">{formatMontant(produit.prix_achat)}</p>
        </div>
        {!produit.has_variantes && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Prix vente</p>
            <p className="text-lg font-medium text-gray-900">{formatMontant(produit.prix_vente)}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Stock total</p>
          <p className="text-lg font-medium text-gray-900">{totalStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">État</p>
          <p className="text-lg font-medium text-gray-900">{produit.etat === 'neuf' ? 'Neuf' : 'Occasion'}</p>
        </div>
      </div>

      {/* Variantes / Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-medium text-gray-800">
            {produit.has_variantes ? 'Stock par variante' : 'Stock'}
          </h2>
          <Separator />
          {!produit.has_variantes ? (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Stock actuel</span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium">{totalStock}</span>
                <StockBadge stock={totalStock} seuil={totalSeuil} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {produit.variantes?.map(v => {
                const label = v.attributs && Object.keys(v.attributs).length > 0
                  ? Object.entries(v.attributs).map(([k, val]) => `${k}: ${val}`).join(' / ')
                  : 'Défaut'
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{v.stock_actuel}</span>
                      <StockBadge stock={v.stock_actuel} seuil={v.seuil_alerte} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prix par variante — uniquement si has_variantes */}
        {produit.has_variantes && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-medium text-gray-800">Prix par variante</h2>
            <Separator />
            <div className="space-y-2">
              {produit.variantes?.map(v => {
                const label = v.attributs && Object.keys(v.attributs).length > 0
                  ? Object.entries(v.attributs).map(([k, val]) => `${k}: ${val}`).join(' / ')
                  : 'Défaut'
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-sm font-semibold text-[#1A7A4A]">
                      {formatMontant(v.prix_vente ?? produit.prix_vente)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fournisseur */}
      {produit.fournisseur_nom && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Nom : </span>{produit.fournisseur_nom}</div>
            {produit.fournisseur_telephone && (
              <div><span className="text-gray-500">Tél : </span>{produit.fournisseur_telephone}</div>
            )}
            {produit.fournisseur_contact && (
              <div><span className="text-gray-500">Contact : </span>{produit.fournisseur_contact}</div>
            )}
          </div>
          {produit.fournisseur_notes && (
            <p className="text-sm text-gray-500">{produit.fournisseur_notes}</p>
          )}
        </div>
      )}

      {/* Dialog entrée stock */}
      <Dialog open={stockDialog} onOpenChange={setStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entrée de stock — {produit.designation}</DialogTitle>
          </DialogHeader>
          <EntreeStockForm
            boutiqueId={id}
            variantes={produit.variantes ?? []}
            onSuccess={() => { setStockDialog(false); load() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}