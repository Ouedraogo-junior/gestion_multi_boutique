// src/pages/approvisionnements/NouvelApprovisionnementPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useBoutique } from '@/hooks/useBoutique'
import { getProduits } from '@/api/produits'
import {
  getFournisseurs,
  createFournisseur,
  createApprovisionnement,
  type Fournisseur,
  type Approvisionnement,
} from '@/api/approvisionnements'
import RecuApprovisionnement from './components/RecuApprovisionnement'
import { formatMontant } from '@/utils/format'

interface Ligne {
  variante_id: number
  label: string
  reference: string
  quantite: number
  prix_achat: number
}

interface ProduitOption {
  variante_id: number
  label: string
  reference: string
  prix_achat: number
}

export default function NouvelApprovisionnementPage() {
  const { boutiqueId }   = useParams()
  const navigate         = useNavigate()
  const { boutiqueActive } = useBoutique()
  const id               = Number(boutiqueId)

  const [lignes,          setLignes]          = useState<Ligne[]>([])
  const [note,            setNote]            = useState('')
  const [loading,         setLoading]         = useState(false)
  const [recuDialog,      setRecuDialog]      = useState(false)
  const [approFinal,      setApproFinal]      = useState<Approvisionnement | null>(null)
  const recuRef                               = useRef<HTMLDivElement>(null)

  // Fournisseur
  const [fournisseurs,     setFournisseurs]     = useState<Fournisseur[]>([])
  const [fournisseurId,    setFournisseurId]    = useState<number | null>(null)
  const [fournisseurSearch, setFournisseurSearch] = useState('')
  const [showFournisseurDropdown, setShowFournisseurDropdown] = useState(false)
  const [nouveauFournisseur, setNouveauFournisseur] = useState(false)
  const [newFourn, setNewFourn] = useState({ nom: '', telephone: '', provenance: '', adresse: '' })

  // Produits
  const [produitOptions,  setProduitOptions]  = useState<ProduitOption[]>([])
  const [produitSearch,   setProduitSearch]   = useState('')
  const [activeLigneIdx,  setActiveLigneIdx]  = useState<number | null>(null)
  const [showProduitDropdown, setShowProduitDropdown] = useState(false)

  const [pretAPrint, setPretAPrint] = useState(false)


  useEffect(() => {
  console.log('pretAPrint:', pretAPrint)
  console.log('approFinal:', approFinal)
  console.log('recuRef.current:', recuRef.current)
  if (pretAPrint && approFinal && recuRef.current) {
    setPretAPrint(false)
    handlePrint()
  }
}, [pretAPrint, approFinal])

  // Charger fournisseurs
  useEffect(() => {
    getFournisseurs(id).then(res => setFournisseurs(res.data))
  }, [id])

  // Charger produits pour la recherche
  useEffect(() => {
  if (produitSearch.length < 2) { setProduitOptions([]); return }
    getProduits(id, { search: produitSearch, actif: true, per_page: 20 }).then(res => {
    const data = res.data?.data ?? res.data
    const options: ProduitOption[] = []
    for (const p of data) {
      if (!p.has_variantes) {
        const v = p.variantes?.[0]
        if (v) options.push({
          variante_id: v.id,
          label:       p.designation,
          reference:   p.reference,
          prix_achat:  Number(p.prix_achat) || 0,  // produit simple → prix_achat produit, correct
        })
      } else {
        for (const v of p.variantes ?? []) {
          const attrs = v.attributs ? Object.values(v.attributs).join(' / ') : ''
          options.push({
            variante_id: v.id,
            label:       attrs ? `${p.designation} (${attrs})` : p.designation,
            reference:   p.reference,
            prix_achat:  Number(v.prix_achat) || Number(p.prix_achat) || 0,  // ← variante d'abord, fallback produit
          })
        }
      }
    }
    setProduitOptions(options)
    setShowProduitDropdown(true)
  })
}, [produitSearch])

  const fournisseursFiltres = fournisseurs.filter(f =>
    f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase())
  )

  const handleSelectFournisseur = (f: Fournisseur) => {
    setFournisseurId(f.id)
    setFournisseurSearch(f.nom)
    setShowFournisseurDropdown(false)
  }

  const handleSelectProduit = (opt: ProduitOption) => {
    if (activeLigneIdx === null) return
    // Vérifier doublon
    const existant = lignes.findIndex((l, i) => i !== activeLigneIdx && l.variante_id === opt.variante_id)
    if (existant >= 0) {
      toast.error('Ce produit est déjà dans la liste')
      return
    }
    setLignes(prev => prev.map((l, i) => i === activeLigneIdx ? {
      ...l,
      variante_id: opt.variante_id,
      label:       opt.label,
      reference:   opt.reference,
      prix_achat:  opt.prix_achat,
    } : l))
    setProduitSearch('')
    setShowProduitDropdown(false)
    setActiveLigneIdx(null)
  }

  const ajouterLigne = () => {
    setLignes(prev => [...prev, { variante_id: 0, label: '', reference: '', quantite: 1, prix_achat: 0 }])
  }

  const supprimerLigne = (i: number) => {
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateLigne = (i: number, champ: keyof Ligne, val: number) => {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [champ]: val } : l))
  }

  const totalGeneral = lignes.reduce((s, l) => s + l.prix_achat * l.quantite, 0)

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; -webkit-print-color-adjust: exact; }`,
    onBeforePrint: async () => {
    console.log('approFinal:', approFinal)
    console.log('recuRef:', recuRef.current)
  },
    onAfterPrint: () => {
      setRecuDialog(false)
      setApproFinal(null)
      navigate(`/boutiques/${id}/approvisionnements`)
    },
  })

  const handleSubmit = async () => {
    if (lignes.length === 0) { toast.error('Ajoutez au moins un produit'); return }
    if (lignes.some(l => l.variante_id === 0)) { toast.error('Sélectionnez un produit pour chaque ligne'); return }
    if (!fournisseurId && !nouveauFournisseur) { toast.error('Sélectionnez ou créez un fournisseur'); return }
    if (nouveauFournisseur && !newFourn.nom) { toast.error('Le nom du fournisseur est requis'); return }

    setLoading(true)
    try {
      let fId = fournisseurId

      // Créer le fournisseur si nouveau
      if (nouveauFournisseur) {
        const res = await createFournisseur(id, newFourn)
        fId = res.data.id
      }

      const res = await createApprovisionnement(id, {
        fournisseur_id: fId!,
        note,
        lignes: lignes.map(l => ({
          variante_id: l.variante_id,
          quantite:    l.quantite,
          prix_achat:  l.prix_achat,
        })),
      })

      setApproFinal(res.data)
      setRecuDialog(true)
      setPretAPrint(true)  // ← déclenche après le rendu
      toast.success(`Approvisionnement ${res.data.reference} enregistré`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/boutiques/${id}/approvisionnements`)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Nouvel approvisionnement</h1>
          <p className="text-gray-500 text-sm mt-0.5">Entrée en stock depuis un fournisseur</p>
        </div>
      </div>

      {/* Fournisseur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>

        {!nouveauFournisseur ? (
          <div className="space-y-3">
            <div className="relative">
              <Label>Rechercher un fournisseur existant</Label>
              <Input
                className="mt-1"
                placeholder="Nom du fournisseur..."
                value={fournisseurSearch}
                onChange={e => { setFournisseurSearch(e.target.value); setShowFournisseurDropdown(true) }}
                onFocus={() => setShowFournisseurDropdown(true)}
              />
              {showFournisseurDropdown && fournisseursFiltres.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {fournisseursFiltres.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFournisseur(f)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F4F6F5] text-sm"
                    >
                      <span className="font-medium">{f.nom}</span>
                      {f.telephone  && <span className="text-gray-400 ml-2 text-xs">{f.telephone}</span>}
                      {f.provenance && <span className="text-gray-400 ml-2 text-xs">· {f.provenance}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setNouveauFournisseur(true); setFournisseurId(null); setFournisseurSearch('') }}
              className="text-sm text-[#1A7A4A] hover:underline"
            >
              + Nouveau fournisseur
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input value={newFourn.nom} onChange={e => setNewFourn(f => ({ ...f, nom: e.target.value }))} placeholder="Nom du fournisseur" />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input value={newFourn.telephone} onChange={e => setNewFourn(f => ({ ...f, telephone: e.target.value }))} placeholder="Ex: 70000000" />
              </div>
              <div className="space-y-1">
                <Label>Provenance</Label>
                <Input value={newFourn.provenance} onChange={e => setNewFourn(f => ({ ...f, provenance: e.target.value }))} placeholder="Ex: Chine, Dubai..." />
              </div>
              <div className="space-y-1">
                <Label>Adresse</Label>
                <Input value={newFourn.adresse} onChange={e => setNewFourn(f => ({ ...f, adresse: e.target.value }))} placeholder="Adresse" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNouveauFournisseur(false)}
              className="text-sm text-gray-400 hover:underline"
            >
              ← Utiliser un fournisseur existant
            </button>
          </div>
        )}
      </div>

      {/* Lignes produits */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800">Produits</h2>
          <Button type="button" onClick={ajouterLigne} variant="outline" className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2] gap-2">
            <Plus size={16} /> Ajouter une ligne
          </Button>
        </div>

        {lignes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Cliquez sur "Ajouter une ligne" pour commencer
          </div>
        ) : (
          <div className="space-y-3">
            {lignes.map((ligne, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                {/* Recherche produit */}
                <div className="col-span-5 relative">
                  {ligne.label ? (
                    <div className="flex items-center gap-2 bg-[#F4F6F5] rounded-lg px-3 py-2 text-sm">
                      <span className="flex-1 truncate">{ligne.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, variante_id: 0, label: '', reference: '' } : l))
                          setActiveLigneIdx(i)
                          setProduitSearch('')
                        }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Input
                        placeholder="Rechercher un produit..."
                        value={activeLigneIdx === i ? produitSearch : ''}
                        onChange={e => { setProduitSearch(e.target.value); setActiveLigneIdx(i) }}
                        onFocus={() => setActiveLigneIdx(i)}
                      />
                      {activeLigneIdx === i && showProduitDropdown && produitOptions.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {produitOptions.map(opt => (
                            <button
                              key={opt.variante_id}
                              type="button"
                              onClick={() => handleSelectProduit(opt)}
                              className="w-full text-left px-4 py-2.5 hover:bg-[#F4F6F5] text-sm"
                            >
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-gray-400 ml-2 text-xs">{opt.reference}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantité */}
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={1}
                    value={ligne.quantite}
                    onFocus={e => e.target.select()}
                    onChange={e => updateLigne(i, 'quantite', Number(e.target.value))}
                    placeholder="Qté"
                  />
                </div>

                {/* Prix achat */}
                <div className="col-span-3">
                  <Input
                    type="number"
                    min={0}
                    value={ligne.prix_achat}
                    onFocus={e => e.target.select()}
                    onChange={e => updateLigne(i, 'prix_achat', Number(e.target.value))}
                    placeholder="Prix achat"
                  />
                </div>

                {/* Total ligne */}
                <div className="col-span-1 text-right text-sm text-gray-600 font-medium">
                  {formatMontant(ligne.prix_achat * ligne.quantite)}
                </div>

                {/* Supprimer */}
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => supprimerLigne(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* En-têtes colonnes */}
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-0.5 -mt-1">
              <div className="col-span-5">Produit</div>
              <div className="col-span-2">Quantité</div>
              <div className="col-span-3">Prix achat (FCFA)</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
          </div>
        )}

        {lignes.length > 0 && (
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500 mr-3">Total général</span>
            <span className="text-black-500 font-semibold text-[#1A7A4A]">{formatMontant(totalGeneral)}</span>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
        <Label>Note (optionnel)</Label>
        <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Observations, numéro de bon de livraison..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => navigate(`/boutiques/${id}/approvisionnements`)}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          {loading ? 'Enregistrement...' : 'Valider l\'approvisionnement'}
        </Button>
      </div>

      {/* Reçu monté en arrière-plan */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '148mm', zIndex: -1 }}>
        {approFinal && boutiqueActive && (
          <RecuApprovisionnement
            ref={recuRef}
            appro={approFinal}
            boutique={boutiqueActive}
            logoBase64={boutiqueActive.logo_base64 ?? null}
          />
        )}
      </div>

      {/* Dialog reçu */}
      <Dialog open={recuDialog} onOpenChange={setRecuDialog}>
        <DialogContent className="max-w-[180mm] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approvisionnement enregistré</DialogTitle>
          </DialogHeader>
          {approFinal && boutiqueActive && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-500 text-center">
                Réf : <strong>{approFinal.reference}</strong> — {formatMontant(
                  approFinal.lignes.reduce((s, l) => s + Number(l.prix_achat) * l.quantite, 0)
                )}
              </p>
              <Button onClick={() => setPretAPrint(true)} className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white">
                <Printer size={18} className="mr-2" />
                Imprimer le reçu
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-200"
                onClick={() => {
                  setRecuDialog(false)
                  setApproFinal(null)
                  navigate(`/boutiques/${id}/approvisionnements`)
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