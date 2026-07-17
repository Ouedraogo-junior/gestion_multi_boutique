// src/pages/transferts-boutiques/NouveauTransfertPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RechercheProduitsInput from '@/pages/ventes/components/RechercheProduitsInput'
import type { ProduitSelectionne } from '@/pages/ventes/components/RechercheProduitsInput'
import { getReferentiels } from '@/api/referentiels'
import {
  getBoutiquesDisponibles,
  getAvanceDisponiblePourBoutique,
  createTransfert,
} from '@/api/transferts-boutiques'
import type { BoutiqueOption, AvanceDisponible } from '@/api/transferts-boutiques'
import { formatMontant } from '@/utils/format'
import { toast } from 'sonner'

interface LigneTransfert {
  variante_id: number
  produit_id: number
  label: string
  prix_unitaire: number
  quantite: number
  stock_actuel: number
  seuil_alerte: number
}

interface Operateur { id: number; libelle: string }

export default function NouveauTransfertPage() {
  const { boutiqueId } = useParams()
  const navigate = useNavigate()
  const id = Number(boutiqueId)

  const [boutiques, setBoutiques]                       = useState<BoutiqueOption[]>([])
  const [boutiqueDestinationId, setBoutiqueDestinationId] = useState('')
  const [lignes, setLignes]                             = useState<LigneTransfert[]>([])
  const [montantConvenu, setMontantConvenu]             = useState('')
  const [note, setNote]                                 = useState('')
  const [loading, setLoading]                           = useState(false)

  const [enregistrerPaiement, setEnregistrerPaiement] = useState(false)
  const [montantPaiement, setMontantPaiement]         = useState('')
  const [modePaiement, setModePaiement]               = useState<'especes' | 'mobile_money' | 'avance_client'>('especes')
  const [operateurId, setOperateurId]                 = useState<number | ''>('')
  const [operateurs, setOperateurs]                   = useState<Operateur[]>([])
  const [referencePaiement, setReferencePaiement]     = useState('')
  const [datePaiement, setDatePaiement]               = useState(new Date().toISOString().split('T')[0])
  const [avanceInfo, setAvanceInfo]                   = useState<AvanceDisponible | null>(null)

  useEffect(() => {
    getBoutiquesDisponibles(id).then(res => setBoutiques(res.data))
  }, [id])

  useEffect(() => {
    getReferentiels(id, 'operateur_mm').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setOperateurs(data.map((o: { id: number; libelle: string }) => ({ id: o.id, libelle: o.libelle })))
    })
  }, [id])

  // Vérifie la disponibilité d'avance dès qu'une boutique destinataire est choisie
  useEffect(() => {
    if (!boutiqueDestinationId) { setAvanceInfo(null); return }
    getAvanceDisponiblePourBoutique(id, Number(boutiqueDestinationId))
      .then(res => setAvanceInfo(res.data))
      .catch(() => setAvanceInfo(null))
    // Si le mode avance était sélectionné mais la nouvelle boutique n'en a pas, on repasse en espèces
    setModePaiement(m => m === 'avance_client' ? 'especes' : m)
  }, [boutiqueDestinationId, id])

  const montantCalcule = lignes.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0)
  const montantDu      = montantConvenu ? Number(montantConvenu) : montantCalcule

  const plafondPaiement = modePaiement === 'avance_client' && avanceInfo?.disponible
    ? Math.min(montantDu, avanceInfo.solde_avance ?? 0)
    : montantDu

  const handleSelectProduit = (item: ProduitSelectionne) => {
    const existant = lignes.findIndex(l => l.variante_id === item.variante.id)
    if (existant >= 0) {
      setLignes(prev => prev.map((l, i) => i === existant ? { ...l, quantite: l.quantite + 1 } : l))
      return
    }
    setLignes(prev => [{
      variante_id:   item.variante.id,
      produit_id:    item.produit.id,
      label:         item.label,
      prix_unitaire: item.variante.prix_vente ?? item.produit.prix_vente,
      quantite:      1,
      stock_actuel:  item.variante.stock_actuel,
      seuil_alerte:  item.variante.seuil_alerte,
    }, ...prev])
  }

  const handleChangeLigne = (index: number, champ: 'quantite' | 'prix_unitaire', valeur: number) => {
    setLignes(prev => prev.map((l, i) => i === index ? { ...l, [champ]: valeur } : l))
  }

  const handleRemoveLigne = (index: number) => {
    setLignes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!boutiqueDestinationId) { toast.error('Sélectionnez la boutique destinataire'); return }
    if (lignes.length === 0) { toast.error('Aucun produit ajouté'); return }

    for (const l of lignes) {
      if (l.quantite <= 0) {
        toast.error(`Quantité invalide pour ${l.label}`)
        return
      }
      if (l.quantite > l.stock_actuel) {
        toast.error(`Stock insuffisant pour ${l.label} (disponible : ${l.stock_actuel})`)
        return
      }
    }

    if (enregistrerPaiement) {
      if (!montantPaiement || Number(montantPaiement) <= 0) {
        toast.error('Montant du paiement invalide')
        return
      }
      if (Number(montantPaiement) > plafondPaiement) {
        toast.error(`Le paiement dépasse le maximum disponible (${formatMontant(plafondPaiement)})`)
        return
      }
      if (modePaiement === 'mobile_money' && !operateurId) {
        toast.error('Sélectionnez un opérateur pour le mobile money')
        return
      }
    }

    setLoading(true)
    try {
      const res = await createTransfert(id, {
        boutique_destination_id: Number(boutiqueDestinationId),
        note: note || undefined,
        montant_convenu: montantConvenu ? Number(montantConvenu) : undefined,
        lignes: lignes.map(l => ({
          variante_id:   l.variante_id,
          quantite:      l.quantite,
          prix_unitaire: l.prix_unitaire,
        })),
        paiement: enregistrerPaiement ? {
          montant: Number(montantPaiement),
          mode: modePaiement,
          operateur_id: modePaiement === 'mobile_money' ? (operateurId as number) : null,
          client_avance_id: modePaiement === 'avance_client' ? avanceInfo?.client_id : undefined,
          reference_paiement: referencePaiement || undefined,
          date_paiement: datePaiement,
        } : undefined,
      })

      toast.success(`Transfert ${res.data.reference} enregistré`)
      navigate(`/boutiques/${id}/transferts-boutiques/${res.data.id}`)
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
        <button onClick={() => navigate(`/boutiques/${id}/transferts-boutiques`)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Nouveau transfert inter-boutique</h1>
          <p className="text-gray-500 text-sm mt-1">Marchandise cédée à une autre boutique du réseau</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Boutique destinataire */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <Label>Boutique destinataire *</Label>
            <Select value={boutiqueDestinationId} onValueChange={setBoutiqueDestinationId}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                {boutiques.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {boutiques.length === 0 && (
              <p className="text-xs text-amber-600">Aucune autre boutique active trouvée.</p>
            )}
          </div>

          {/* Recherche produit */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <RechercheProduitsInput boutiqueId={id} onSelect={handleSelectProduit} />
          </div>

          {/* Panier */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-base font-medium text-gray-800 mb-4">Marchandise à transférer</h3>
            {lignes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Recherchez un produit pour l'ajouter au transfert</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Produit</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Qté</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Prix unitaire (FCFA)</th>
                      <th className="text-right py-2 px-3 text-xs text-gray-500">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l, i) => (
                      <tr key={l.variante_id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm text-gray-800">
                          {l.label}
                          <span className="block text-xs text-gray-400">Stock dispo : {l.stock_actuel}</span>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={1}
                            max={l.stock_actuel}
                            value={l.quantite}
                            onChange={e => handleChangeLigne(i, 'quantite', Number(e.target.value))}
                            className="w-20 border-gray-200"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={0}
                            value={l.prix_unitaire}
                            onChange={e => handleChangeLigne(i, 'prix_unitaire', Number(e.target.value))}
                            className="w-28 border-gray-200"
                          />
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium text-gray-900">
                          {formatMontant(l.prix_unitaire * l.quantite)}
                        </td>
                        <td className="py-2 px-3">
                          <button onClick={() => handleRemoveLigne(i)} className="text-gray-400 hover:text-[#E8314A]">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {lignes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm font-medium">
                <span className="text-gray-500">Montant calculé</span>
                <span className="text-[#1A7A4A]">{formatMontant(montantCalcule)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="space-y-1">
              <Label>Montant convenu (optionnel)</Label>
              <Input
                type="number"
                min={0}
                value={montantConvenu}
                onChange={e => setMontantConvenu(e.target.value)}
                placeholder={`Par défaut : ${formatMontant(montantCalcule)}`}
                className="border-gray-200"
              />
              <p className="text-xs text-gray-400">Laisser vide pour utiliser le montant calculé des lignes.</p>
            </div>
            <div className="space-y-1">
              <Label>Note (optionnel)</Label>
              <Input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Observations..."
                className="border-gray-200"
              />
            </div>
          </div>

          {/* Paiement immédiat — optionnel */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Paiement immédiat</Label>
              <button
                type="button"
                onClick={() => setEnregistrerPaiement(v => !v)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  enregistrerPaiement
                    ? 'bg-[#D4F0E2] text-[#145C38] border-[#1A7A4A]'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {enregistrerPaiement ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            {enregistrerPaiement && (
              <>
                {avanceInfo?.disponible && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm">
                    <p className="text-[#1A7A4A] font-medium">Avance disponible : {formatMontant(avanceInfo.solde_avance ?? 0)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Déposée par {avanceInfo.client_nom}, déjà en caisse.</p>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Montant reçu *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={montantPaiement}
                    onChange={e => setMontantPaiement(e.target.value)}
                    placeholder={`Max : ${formatMontant(plafondPaiement)}`}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Mode *</Label>
                  <div className={`grid ${avanceInfo?.disponible ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                    <button
                      type="button"
                      onClick={() => setModePaiement('especes')}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        modePaiement === 'especes'
                          ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Espèces
                    </button>
                    <button
                      type="button"
                      onClick={() => setModePaiement('mobile_money')}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        modePaiement === 'mobile_money'
                          ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Mobile Money
                    </button>
                    {avanceInfo?.disponible && (
                      <button
                        type="button"
                        onClick={() => setModePaiement('avance_client')}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          modePaiement === 'avance_client'
                            ? 'border-[#29ABE2] bg-blue-50 text-[#1A8EC4] font-medium'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        Avance
                      </button>
                    )}
                  </div>
                </div>

                {modePaiement === 'mobile_money' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Opérateur *</Label>
                    {operateurs.length === 0 ? (
                      <p className="text-xs text-amber-600">
                        Aucun opérateur configuré — ajoutez un référentiel "operateur_mm" dans les paramètres.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {operateurs.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setOperateurId(o.id)}
                            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                              operateurId === o.id
                                ? 'border-[#1A7A4A] bg-[#D4F0E2] text-[#145C38] font-medium'
                                : 'border-gray-200 text-gray-600'
                            }`}
                          >
                            {o.libelle}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {modePaiement !== 'avance_client' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Référence (optionnel)</Label>
                    <Input
                      value={referencePaiement}
                      onChange={e => setReferencePaiement(e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Date du paiement *</Label>
                  <Input
                    type="date"
                    value={datePaiement}
                    onChange={e => setDatePaiement(e.target.value)}
                    className="border-gray-200"
                  />
                </div>
              </>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || lignes.length === 0}
            className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white h-11"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Enregistrement...' : 'Enregistrer le transfert'}
          </Button>
        </div>
      </div>
    </div>
  )
}