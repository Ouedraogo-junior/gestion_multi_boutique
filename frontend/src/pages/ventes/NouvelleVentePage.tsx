import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { Printer, Save, FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import RechercheProduitsInput from './components/RechercheProduitsInput'
import LigneVente from './components/LigneVente'
import PaiementSection from './components/PaiementSection'
import RecuImprimable from './components/RecuImprimable'
import type { Ligne } from './components/LigneVente'
import type { PaiementState } from './components/PaiementSection'
import type { ProduitSelectionne } from './components/RechercheProduitsInput'
import { createVente, updateVente, getVente, validerVente } from '@/api/ventes'
import type { Vente, VenteDetail } from '@/api/ventes'
import { useBoutique } from '@/hooks/useBoutique'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

const paiementVide: PaiementState = {
  especes: '', mobile_money: '', operateur_id: '', credit: '', client_id: '', avance: ''
}

export default function NouvelleVentePage() {
  const { boutiqueId, vid } = useParams()
  const navigate           = useNavigate()
  const { boutiqueActive } = useBoutique()
  const id                 = Number(boutiqueId)
  const venteId            = vid ? Number(vid) : null

  const [lignes, setLignes]           = useState<Ligne[]>([])
  const [paiement, setPaiement]       = useState<PaiementState>(paiementVide)
  const [soldeAvance, setSoldeAvance] = useState<number | null>(null)
  const [loading, setLoading]         = useState(false)
  const [venteFinale, setVenteFinale] = useState<Vente | null>(null)
  const [recuDialog, setRecuDialog]   = useState(false)
  const [pretAPrint, setPretAPrint]   = useState(false)
  const recuRef                       = useRef<HTMLDivElement>(null)
  const [brouillonId, setBrouillonId] = useState<number | null>(null)

  const estBrouillon = venteFinale?.statut === 'brouillon'

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `
                @page { size: A4; margin: 0; }
                body { margin: 0; -webkit-print-color-adjust: exact; }
                `,
    onBeforePrint: async () => {
    // console.log('venteFinale:', venteFinale)
    // console.log('recuRef:', recuRef.current)
  },
    onAfterPrint: () => {
      setRecuDialog(false)
      setVenteFinale(null)
      setPretAPrint(false)
      setLignes([])
      setPaiement(paiementVide)
      navigate(`/boutiques/${id}/ventes`)
    },
  })

  useEffect(() => {
    if (!venteId) return
    getVente(id, venteId).then(res => {
      const v = res.data
      setLignes(v.details?.map((d: VenteDetail) => ({
        variante_id:    d.variante_id,
        produit_id:     d.variante?.produit?.id ?? 0,
        label:          d.variante?.produit?.designation ?? '',
        prix_catalogue: d.prix_catalogue,
        prix_applique:  d.prix_applique,
        quantite:       d.quantite,
        remise_montant: d.remise_montant,
        stock_actuel:   d.variante?.stock_actuel ?? 0,
        seuil_alerte:   d.variante?.seuil_alerte ?? 0,
      })) ?? [])
      if (v.client_id) {
        setPaiement(prev => ({ ...prev, client_id: String(v.client_id) }))
      }
      setBrouillonId(v.id)
    })
  }, [venteId])

  // Déclencher l'impression seulement après que React a re-rendu avec venteFinale
  useEffect(() => {
    if (pretAPrint && venteFinale && recuRef.current) {
      setPretAPrint(false)
      handlePrint()
    }
  }, [pretAPrint, venteFinale])

  const totalBrut   = lignes.reduce((s, l) => s + l.prix_applique * l.quantite, 0)
  const totalRemise = lignes.reduce((s, l) => s + l.remise_montant, 0)
  const totalNet    = totalBrut - totalRemise

  const handleSelectProduit = (item: ProduitSelectionne) => {
    const existant = lignes.findIndex(l => l.variante_id === item.variante.id)
    if (existant >= 0) {
      setLignes(prev => prev.map((l, i) =>
        i === existant ? { ...l, quantite: l.quantite + 1 } : l
      ))
      return
    }
    setLignes(prev => [{
      variante_id:    item.variante.id,
      produit_id:     item.produit.id,
      label:          item.label,
      prix_catalogue: item.variante.prix_vente ?? item.produit.prix_vente,
      prix_applique:  item.variante.prix_vente ?? item.produit.prix_vente,
      quantite:       1,
      remise_montant: 0,
      stock_actuel:   item.variante.stock_actuel,
      seuil_alerte:   item.variante.seuil_alerte,
    }, ...prev])
  }

  const handleChangeLigne = (index: number, champ: keyof Ligne, valeur: number) => {
    setLignes(prev => prev.map((l, i) => i === index ? { ...l, [champ]: valeur } : l))
  }

  const handleRemoveLigne = (index: number) => {
    setLignes(prev => prev.filter((_, i) => i !== index))
  }

  const buildPaiements = () => {
    let resteAAffecter = totalNet

    const especesRecu     = Number(paiement.especes)      || 0
    const mobileMoneyRecu = Number(paiement.mobile_money) || 0
    const avanceRecu      = Number(paiement.avance)       || 0

    const especesAffecte = Math.min(especesRecu, resteAAffecter)
    resteAAffecter -= especesAffecte

    const mobileMoneyAffecte = Math.min(mobileMoneyRecu, resteAAffecter)
    resteAAffecter -= mobileMoneyAffecte

    const avanceAffecte = Math.min(avanceRecu, resteAAffecter)
    resteAAffecter -= avanceAffecte

    const credit = resteAAffecter

    const result = []
    if (especesAffecte > 0) result.push({ mode: 'especes' as const, montant: especesAffecte })
    if (mobileMoneyAffecte > 0) result.push({
      mode: 'mobile_money' as const,
      montant: mobileMoneyAffecte,
      operateur_id: paiement.operateur_id ? Number(paiement.operateur_id) : null,
    })
    if (avanceAffecte > 0) result.push({ mode: 'avance_client' as const, montant: avanceAffecte })
    if (credit > 0) result.push({ mode: 'credit' as const, montant: credit })

    return result
  }

  const handleSave = async (valider = false) => {
    if (lignes.length === 0) { toast.error('Panier vide'); return }

    if (valider) {
      const credit = totalNet - (Number(paiement.especes) || 0) - (Number(paiement.mobile_money) || 0) - (Number(paiement.avance) || 0)
      if (credit > 0 && (!paiement.client_id || paiement.client_id === '0')) {
        toast.error('Un client est requis pour une vente à crédit')
        return
      }
      if ((Number(paiement.mobile_money) || 0) > 0 && !paiement.operateur_id) {
        toast.error('Veuillez sélectionner un opérateur pour le mobile money')
        return
      }

      const avanceRecu = Number(paiement.avance) || 0
      if (avanceRecu > 0) {
        if (!paiement.client_id || paiement.client_id === '0') {
          toast.error('Un client est requis pour payer avec une avance')
          return
        }
        if (soldeAvance !== null && avanceRecu > soldeAvance) {
          toast.error(`Solde d'avance insuffisant (disponible : ${formatMontant(soldeAvance)})`)
          return
        }
      }
    }

    setLoading(true)
    try {
      let vente: Vente

      const lignesPayload = lignes.map(l => ({
        variante_id:    l.variante_id,
        quantite:       l.quantite,
        prix_applique:  l.prix_applique,
        remise_montant: l.remise_montant,
      }))

      const clientId = paiement.client_id && paiement.client_id !== '0'
        ? Number(paiement.client_id) : null

      if (valider && brouillonId) {
        // 1. Mettre à jour les lignes du brouillon
        await updateVente(id, brouillonId, {
          client_id: clientId,
          lignes:    lignesPayload,
          paiements: [],
        })
        // 2. Valider le brouillon via l'endpoint dédié
        const res = await validerVente(id, brouillonId, buildPaiements())
        vente = res.data
      } else if (brouillonId && !valider) {
        // Sauvegarder brouillon existant
        const res = await updateVente(id, brouillonId, {
          client_id: clientId,
          lignes:    lignesPayload,
          paiements: [],
        })
        vente = res.data
      } else {
        // Nouvelle vente (avec ou sans validation)
        const res = await createVente(id, {
          client_id: clientId,
          lignes:    lignesPayload,
          paiements: buildPaiements(),
          valider,
        })
        vente = res.data
      }

      // Dans les deux cas (validée ou brouillon), on affiche le dialog de reçu/devis
      setVenteFinale(vente)
      setRecuDialog(true)
      toast.success(valider ? `Vente validée — Facture ${vente.numero_facture}` : 'Brouillon enregistré')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/boutiques/${id}/ventes`)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Nouvelle vente</h1>
          <p className="text-gray-500 text-sm mt-1">Enregistrer une nouvelle transaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <RechercheProduitsInput boutiqueId={id} onSelect={handleSelectProduit} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-medium text-gray-800 mb-4">Panier</h3>
            {lignes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Recherchez un produit pour l'ajouter au panier</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Produit</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Qté</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Prix (FCFA)</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Remise (FCFA)</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <LigneVente key={l.variante_id} ligne={l} index={i} onChange={handleChangeLigne} onRemove={handleRemoveLigne} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {lignes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Total brut</span><span>{formatMontant(totalBrut)}</span>
                </div>
                {totalRemise > 0 && (
                  <div className="flex justify-between text-[#E8314A]">
                    <span>Remise</span><span>- {formatMontant(totalRemise)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-black-500">
                  <span>Total net</span>
                  <span className="text-[#1A7A4A]">{formatMontant(totalNet)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-medium text-gray-800 mb-4">Paiement</h3>
            <PaiementSection
              boutiqueId={id}
              totalNet={totalNet}
              paiement={paiement}
              onChange={setPaiement}
              onSoldeAvanceChange={setSoldeAvance}
            />
          </div>
          <div className="space-y-2">
            <Button onClick={() => handleSave(true)} disabled={loading || lignes.length === 0} className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white h-11">
              <Save size={18} className="mr-2" />
              {loading ? 'Enregistrement...' : 'Valider la vente'}
            </Button>
            <Button onClick={() => handleSave(false)} disabled={loading || lignes.length === 0} variant="outline" className="w-full h-11 border-gray-200">
              <FileText size={18} className="mr-2" />
              Enregistrer en brouillon
            </Button>
          </div>
        </div>
      </div>

      {/* Reçu toujours monté dans le DOM */}
      <div style={{
        position: 'fixed',
        top: '-9999px',
        left: 0,
        width: '210mm',
        zIndex: -1
       }}>
        {venteFinale && boutiqueActive && (
            <RecuImprimable
            ref={recuRef}
            vente={venteFinale}
            boutique={boutiqueActive}
            logoBase64={boutiqueActive.logo_base64 ?? null}
          />
        )}
      </div>

      {/* Dialog */}
      <Dialog open={recuDialog} onOpenChange={setRecuDialog}>
        <DialogContent className="max-w-[180mm] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{estBrouillon ? 'Brouillon enregistré' : 'Vente validée'}</DialogTitle>
          </DialogHeader>
          {venteFinale && boutiqueActive && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-500 text-center">
                {estBrouillon
                  ? <>Brouillon <strong>#{venteFinale.id}</strong> — {formatMontant(venteFinale.total_net)}</>
                  : <>Facture <strong>{venteFinale.numero_facture}</strong> — {formatMontant(venteFinale.total_net)}</>
                }
              </p>
              <Button
                onClick={() => handlePrint()}
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
              >
                <Printer size={18} className="mr-2" />
                {estBrouillon ? 'Imprimer le devis' : 'Imprimer le reçu'}
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-200"
                onClick={() => {
                  setRecuDialog(false)
                  setVenteFinale(null)
                  setLignes([])
                  setPaiement(paiementVide)
                  navigate(`/boutiques/${id}/ventes`)
                }}
              >
                Passer sans imprimer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}