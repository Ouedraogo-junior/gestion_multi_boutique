import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createProduit, updateProduit, getProduit } from '@/api/produits'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import type { VarianteForm } from './components/VarianteSection'
import VarianteSection from './components/VarianteSection'
import { toast } from 'sonner'

export default function ProduitFormPage() {
  const { boutiqueId, produitId } = useParams()
  const navigate                   = useNavigate()
  const id                         = Number(boutiqueId)
  const isEdit                     = !!produitId

  const [categories, setCategories]     = useState<Referentiel[]>([])
  const [attributs, setAttributs]       = useState<Referentiel[]>([])
  const [loading, setLoading]           = useState(false)
  const [hasVariantes, setHasVariantes] = useState(false)
  const [variantes, setVariantes]       = useState<VarianteForm[]>([])
  const [stockInitial, setStockInitial] = useState('0')

  const [form, setForm] = useState({
    designation: '',
    categorie_id: '',
    prix_achat: '',
    prix_vente: '',
    etat: 'neuf',
    seuil_alerte: '0',
    description: '',
    fournisseur_nom: '',
    fournisseur_telephone: '',
    fournisseur_contact: '',
    fournisseur_notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    getReferentiels(id, 'categorie_produit').then(res => {
      setCategories(Array.isArray(res.data) ? res.data : [])
    })
    getReferentiels(id, 'attribut_variante').then(res => {
      setAttributs(Array.isArray(res.data) ? res.data : [])
    })

    if (isEdit) {
      getProduit(id, Number(produitId)).then(res => {
        const p = Array.isArray(res.data) ? res.data[0] : res.data.data ?? res.data
        setForm({
          designation:           p.designation           ?? '',
          categorie_id:          String(p.categorie_id   ?? ''),
          prix_achat:            String(p.prix_achat     ?? ''),
          prix_vente:            String(p.prix_vente     ?? ''),
          etat:                  p.etat                  ?? 'neuf',
          seuil_alerte:          String(p.seuil_alerte   ?? 0),
          description:           p.description           ?? '',
          fournisseur_nom:       p.fournisseur_nom        ?? '',
          fournisseur_telephone: p.fournisseur_telephone  ?? '',
          fournisseur_contact:   p.fournisseur_contact    ?? '',
          fournisseur_notes:     p.fournisseur_notes      ?? '',
        })
        setHasVariantes(p.has_variantes)
        if (p.has_variantes && p.variantes) {
          setVariantes(p.variantes.map((v: { attributs: Record<string, string>; prix_vente: number; seuil_alerte: number }) => ({
            attributs:     v.attributs ?? {},
            prix_vente:    String(v.prix_vente ?? ''),
            seuil_alerte:  String(v.seuil_alerte ?? ''),
            stock_initial: '',
          })))
        }
      })
    }
  }, [id, produitId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        categorie_id:  form.categorie_id ? Number(form.categorie_id) : null,
        prix_achat:    Number(form.prix_achat),
        prix_vente:    hasVariantes ? (Number(form.prix_vente) || 0) : Number(form.prix_vente),
        seuil_alerte:  Number(form.seuil_alerte),
        has_variantes: hasVariantes,
        stock_initial: hasVariantes ? undefined : Number(stockInitial),
        variantes: hasVariantes ? variantes.map(v => ({
          attributs:     v.attributs,
          prix_vente:    v.prix_vente    ? Number(v.prix_vente)    : null,
          seuil_alerte:  v.seuil_alerte  ? Number(v.seuil_alerte)  : 0,
          stock_initial: v.stock_initial ? Number(v.stock_initial) : 0,
        })) : undefined,
      }

      if (isEdit) {
        await updateProduit(id, Number(produitId), payload)
        toast.success('Produit modifié')
      } else {
        await createProduit(id, payload)
        toast.success('Produit créé')
      }
      navigate(`/boutiques/${id}/produits`)
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/boutiques/${id}/produits`)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl text-[#1C1C1C]">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Mettre à jour les informations' : 'Remplissez les informations du produit'}
          </p>
        </div>

        {/* Toggle variantes dans le header — uniquement en création */}
        {!isEdit && (
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#1C1C1C]">Avec variantes</p>
              <p className="text-xs text-gray-400">{hasVariantes ? 'Couleur, capacité...' : 'Produit simple'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (hasVariantes) setVariantes([])
                setHasVariantes(v => !v)
              }}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${hasVariantes ? 'bg-[#1A7A4A]' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasVariantes ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-medium text-gray-800">Informations générales</h2>
          <Separator />

          <div className="space-y-2">
            <Label>Désignation *</Label>
            <Input
              value={form.designation}
              onChange={e => set('designation', e.target.value)}
              placeholder="Ex: iPhone 15 Pro"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={form.categorie_id} onValueChange={v => set('categorie_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>État *</Label>
              <Select value={form.etat} onValueChange={v => set('etat', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="occasion">Occasion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prix achat toujours visible */}
          <div className="space-y-2">
            <Label>
              Prix d'achat (FCFA)
              {hasVariantes && (
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  — coût total fournisseur (toutes variantes)
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={form.prix_achat}
              onChange={e => set('prix_achat', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Prix vente et seuil — masqués si has_variantes */}
          {!hasVariantes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix de vente (FCFA) *</Label>
                <Input
                  type="number"
                  value={form.prix_vente}
                  onChange={e => set('prix_vente', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil d'alerte</Label>
                <Input
                  type="number"
                  value={form.seuil_alerte}
                  onChange={e => set('seuil_alerte', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Ce produit a des variantes — le prix de vente et le seuil d'alerte sont définis par variante.
            </p>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Description du produit..."
              rows={3}
            />
          </div>
        </div>

        {/* Fournisseur */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom fournisseur</Label>
              <Input value={form.fournisseur_nom} onChange={e => set('fournisseur_nom', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.fournisseur_telephone} onChange={e => set('fournisseur_telephone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input value={form.fournisseur_contact} onChange={e => set('fournisseur_contact', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes fournisseur</Label>
            <Textarea
              value={form.fournisseur_notes}
              onChange={e => set('fournisseur_notes', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Stock & Variantes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-medium text-gray-800">Stock & Variantes</h2>
          <Separator />

          {!hasVariantes && !isEdit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock initial</Label>
                <Input
                  type="number"
                  value={stockInitial}
                  onChange={e => setStockInitial(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil d'alerte stock</Label>
                <Input
                  type="number"
                  value={form.seuil_alerte}
                  onChange={e => set('seuil_alerte', e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
          ) : (
            <VarianteSection
              variantes={variantes}
              onChange={setVariantes}
              attributsDisponibles={attributs.map(a => a.libelle)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/boutiques/${id}/produits`)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </div>
  )
}