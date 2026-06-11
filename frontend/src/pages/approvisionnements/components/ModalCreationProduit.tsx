// src/pages/approvisionnements/components/ModalCreationProduit.tsx
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Referentiel } from '@/api/referentiels'

interface VarianteForm {
  _key: string
  attributs: Record<string, string>
  prix_achat: string
  prix_vente: string
  seuil_alerte: string
  stock_initial: string
}

interface Props {
  open: boolean
  onClose: () => void
  boutiqueId: number
  categories: Referentiel[]
  attributs: Referentiel[]
  searchInitial: string
  onConfirm: (payload: Record<string, unknown>, label: string) => void
  payloadInitial?: Record<string, unknown> | null
}

function varianteVide(): VarianteForm {
  return {
    _key: crypto.randomUUID(),
    attributs: {},
    prix_achat: '',
    prix_vente: '',
    seuil_alerte: '0',
    stock_initial: '0',
  }
}

export default function ModalCreationProduit({
  open,
  onClose,
  categories,
  attributs,
  searchInitial,
  onConfirm,
  payloadInitial,
}: Props) {
  // ── Champs produit ────────────────────────────────────────────────────────────
  const [designation, setDesignation] = useState('')
  const [categorieId, setCategorieId] = useState<string>('')
  const [etat, setEtat] = useState<'neuf' | 'occasion'>('neuf')
  const [prixAchat, setPrixAchat] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [seuilAlerte, setSeuilAlerte] = useState('0')
  const [stockInitial, setStockInitial] = useState('0')
  const [hasVariantes, setHasVariantes] = useState(false)
  const [variantes, setVariantes] = useState<VarianteForm[]>([varianteVide()])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pré-remplir la désignation avec le terme recherché
  // Cas 1 — nouveau produit (pas de payload)
useEffect(() => {
  if (open && !payloadInitial) {
    setDesignation(searchInitial)
    setCategorieId('')
    setEtat('neuf')
    setPrixAchat('')
    setPrixVente('')
    setSeuilAlerte('0')
    setStockInitial('0')
    setHasVariantes(false)
    setVariantes([varianteVide()])
    setErrors({})
  }
}, [open, searchInitial])

// Cas 2 — réouverture avec payload existant
useEffect(() => {
  //console.log('useEffect payload — open:', open, '| payloadInitial:', payloadInitial)
  if (open && payloadInitial) {
    setDesignation(String(payloadInitial.designation ?? ''))
    setCategorieId(payloadInitial.categorie_id ? String(payloadInitial.categorie_id) : '')
    setEtat((payloadInitial.etat as 'neuf' | 'occasion') ?? 'neuf')
    setPrixAchat(String(payloadInitial.prix_achat ?? ''))
    setPrixVente(String(payloadInitial.prix_vente ?? ''))
    setSeuilAlerte(String(payloadInitial.seuil_alerte ?? '0'))
    setStockInitial(String(payloadInitial.stock_initial ?? '0'))
    setHasVariantes(Boolean(payloadInitial.has_variantes))
    if (payloadInitial.has_variantes && Array.isArray(payloadInitial.variantes)) {
      setVariantes((payloadInitial.variantes as Array<{
        attributs: Record<string, string>
        prix_achat?: number
        prix_vente?: number
        seuil_alerte?: number
        stock_initial?: number
      }>).map(v => ({
        _key: crypto.randomUUID(),
        attributs:     v.attributs    ?? {},
        prix_achat:    String(v.prix_achat    ?? ''),
        prix_vente:    String(v.prix_vente    ?? ''),
        seuil_alerte:  String(v.seuil_alerte  ?? '0'),
        stock_initial: String(v.stock_initial ?? '0'),
      })))
    } else {
      setVariantes([varianteVide()])
    }
    setErrors({})
  }
}, [open, payloadInitial])

  // ── Variantes ─────────────────────────────────────────────────────────────────
  const ajouterVariante = () =>
    setVariantes(prev => [...prev, varianteVide()])

  const supprimerVariante = (key: string) => {
    if (variantes.length === 1) return
    setVariantes(prev => prev.filter(v => v._key !== key))
  }

  const updateVariante = (key: string, patch: Partial<VarianteForm>) =>
    setVariantes(prev => prev.map(v => v._key === key ? { ...v, ...patch } : v))

  const updateAttributVariante = (key: string, attrNom: string, valeur: string) =>
    setVariantes(prev => prev.map(v =>
      v._key === key
        ? { ...v, attributs: { ...v.attributs, [attrNom]: valeur } }
        : v
    ))

  // ── Validation ────────────────────────────────────────────────────────────────
  const valider = () => {
    const errs: Record<string, string> = {}

    if (!designation.trim()) errs.designation = 'La désignation est requise'

    if (!hasVariantes) {
      if (!prixVente) errs.prixVente = 'Le prix de vente est requis'
    } else {
      variantes.forEach((v, i) => {
        if (!v.prix_vente) errs[`variante_prixVente_${i}`] = 'Prix vente requis'
        // Vérifier qu'au moins un attribut est renseigné
        const attrRemplis = Object.values(v.attributs).some(val => val.trim())
        if (!attrRemplis) errs[`variante_attributs_${i}`] = 'Au moins un attribut requis'
      })
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    // Construire le label affiché dans la liste
    const label = designation.trim()

    // Construire le payload pour createProduit
    const payload: Record<string, unknown> = {
      designation: label,
      categorie_id: categorieId ? Number(categorieId) : null,
      etat,
      seuil_alerte: Number(seuilAlerte) || 0,
      has_variantes: hasVariantes,
    }

    if (!hasVariantes) {
      payload.prix_achat = Number(prixAchat) || 0
      payload.prix_vente = Number(prixVente)
      payload.stock_initial = Number(stockInitial) || 0
    } else {
      // prix produit = 0 (overridé par variante)
      payload.prix_achat = 0
      payload.prix_vente = 0
      payload.variantes = variantes.map(v => ({
        attributs: v.attributs,
        prix_achat: Number(v.prix_achat) || 0,
        prix_vente: Number(v.prix_vente) || 0,
        seuil_alerte: Number(v.seuil_alerte) || 0,
        stock_initial: Number(v.stock_initial) || 0,
      }))
    }

    onConfirm(payload, label)
  }

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau produit</DialogTitle>
          <p className="text-sm text-gray-500 mt-0.5">
            Ce produit sera créé et ajouté à la réception
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-2">

          {/* Infos de base */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Désignation *</Label>
              <Input
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="Ex: Samsung Galaxy A55"
              />
              {errors.designation && (
                <p className="text-xs text-red-500">{errors.designation}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Catégorie</Label>
                <select
                  value={categorieId}
                  onChange={e => setCategorieId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7A4A]/20"
                >
                  <option value="">Sans catégorie</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.libelle}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>État</Label>
                <select
                  value={etat}
                  onChange={e => setEtat(e.target.value as 'neuf' | 'occasion')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7A4A]/20"
                >
                  <option value="neuf">Neuf</option>
                  <option value="occasion">Occasion</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toggle variantes */}
          <div className="flex items-center gap-3 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setHasVariantes(!hasVariantes)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                hasVariantes ? 'bg-[#1A7A4A]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  hasVariantes ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-800">Ce produit a des variantes</p>
              <p className="text-xs text-gray-400">Ex: couleurs, capacités, tailles…</p>
            </div>
          </div>

          {/* Produit simple */}
          {!hasVariantes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Prix achat (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={prixAchat}
                    onFocus={e => e.target.select()}
                    onChange={e => setPrixAchat(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prix vente (FCFA) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={prixVente}
                    onFocus={e => e.target.select()}
                    onChange={e => setPrixVente(e.target.value)}
                    placeholder="0"
                  />
                  {errors.prixVente && (
                    <p className="text-xs text-red-500">{errors.prixVente}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Seuil alerte stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={seuilAlerte}
                    onFocus={e => e.target.select()}
                    onChange={e => setSeuilAlerte(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock initial</Label>
                  <Input
                    type="number"
                    min={0}
                    value={stockInitial}
                    onFocus={e => e.target.select()}
                    onChange={e => setStockInitial(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Produit avec variantes */}
          {hasVariantes && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">Variantes</p>
                <Button
                  type="button"
                  onClick={ajouterVariante}
                  variant="outline"
                  size="sm"
                  className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2] gap-1.5 text-xs"
                >
                  <Plus size={13} /> Ajouter une variante
                </Button>
              </div>

              {variantes.map((variante, idx) => (
                <div
                  key={variante._key}
                  className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Variante {idx + 1}
                    </p>
                    {variantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerVariante(variante._key)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Attributs */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Attributs</p>
                    {attributs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {attributs.map(attr => (
                          <div key={attr.id} className="space-y-1">
                            <Label className="text-xs">{attr.libelle}</Label>
                            <Input
                              size={1}
                              className="text-sm"
                              value={variante.attributs[attr.libelle] ?? ''}
                              onChange={e =>
                                updateAttributVariante(variante._key, attr.libelle, e.target.value)
                              }
                              placeholder={`Ex: Noir, 128Go…`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Aucun attribut configuré → champ libre clé/valeur simple
                      <div className="grid grid-cols-2 gap-2">
                        {['Couleur', 'Capacité'].map(attr => (
                          <div key={attr} className="space-y-1">
                            <Label className="text-xs">{attr}</Label>
                            <Input
                              size={1}
                              className="text-sm"
                              value={variante.attributs[attr] ?? ''}
                              onChange={e =>
                                updateAttributVariante(variante._key, attr, e.target.value)
                              }
                              placeholder={attr === 'Couleur' ? 'Ex: Noir' : 'Ex: 128Go'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {errors[`variante_attributs_${idx}`] && (
                      <p className="text-xs text-red-500">
                        {errors[`variante_attributs_${idx}`]}
                      </p>
                    )}
                  </div>

                  {/* Prix + stock */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Prix achat (FCFA)</Label>
                      <Input
                        type="number"
                        min={0}
                        className="text-sm"
                        value={variante.prix_achat}
                        onFocus={e => e.target.select()}
                        onChange={e => updateVariante(variante._key, { prix_achat: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Prix vente (FCFA) *</Label>
                      <Input
                        type="number"
                        min={0}
                        className="text-sm"
                        value={variante.prix_vente}
                        onFocus={e => e.target.select()}
                        onChange={e => updateVariante(variante._key, { prix_vente: e.target.value })}
                        placeholder="0"
                      />
                      {errors[`variante_prixVente_${idx}`] && (
                        <p className="text-xs text-red-500">
                          {errors[`variante_prixVente_${idx}`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seuil alerte</Label>
                      <Input
                        type="number"
                        min={0}
                        className="text-sm"
                        value={variante.seuil_alerte}
                        onFocus={e => e.target.select()}
                        onChange={e => updateVariante(variante._key, { seuil_alerte: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Stock initial</Label>
                      <Input
                        type="number"
                        min={0}
                        className="text-sm"
                        value={variante.stock_initial}
                        onFocus={e => e.target.select()}
                        onChange={e => updateVariante(variante._key, { stock_initial: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <Button
              onClick={valider}
              className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
            >
              Ajouter à la réception
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}