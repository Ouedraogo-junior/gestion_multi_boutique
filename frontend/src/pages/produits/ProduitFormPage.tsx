// src/pages/produits/ProduitFormPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createProduit, updateProduit, getProduit } from '@/api/produits'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import type { VarianteForm } from './components/VarianteSection'
import { toast } from 'sonner'

import InfoGeneralesSection  from './components/InfoGeneralesSection'
import type { InfoGeneralesFormState } from './components/InfoGeneralesSection'
import PrixSection           from './components/PrixSection'
import type { PrixFormState } from './components/PrixSection'
import FournisseurSection    from './components/FournisseurSection'
import type { FournisseurFormState } from './components/FournisseurSection'
import StockVariantesSection from './components/StockVariantesSection'

export default function ProduitFormPage() {
  const { boutiqueId, produitId } = useParams()
  const navigate                  = useNavigate()
  const id                        = Number(boutiqueId)
  const isEdit                    = !!produitId

  const [categories,   setCategories]   = useState<Referentiel[]>([])
  const [attributs,    setAttributs]    = useState<Referentiel[]>([])
  const [loading,      setLoading]      = useState(false)
  const [hasVariantes, setHasVariantes] = useState(false)
  const [variantes,    setVariantes]    = useState<VarianteForm[]>([])
  const [stockInitial, setStockInitial] = useState('0')

  const [infoForm, setInfoForm] = useState<InfoGeneralesFormState>({
    designation:  '',
    categorie_id: '',
    etat:         'neuf',
    description:  '',
  })

  const [prixForm, setPrixForm] = useState<PrixFormState>({
    prix_achat:   '',
    prix_vente:   '',
    seuil_alerte: '0',
  })

  const [fournisseurForm, setFournisseurForm] = useState<FournisseurFormState>({
    fournisseur_id:        null,
    fournisseur_nom:       '',
    fournisseur_telephone: '',
    fournisseur_contact:   '',
    fournisseur_notes:     '',
  })

  const setInfo        = (k: keyof InfoGeneralesFormState,  v: string) => setInfoForm(f => ({ ...f, [k]: v }))
  const setPrix        = (k: keyof PrixFormState,           v: string) => setPrixForm(f => ({ ...f, [k]: v }))
  const setFournisseur = (k: keyof FournisseurFormState, v: string | number | null) => setFournisseurForm(f => ({ ...f, [k]: v }))

  // Chargement référentiels + produit en édition
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

        setInfoForm({
          designation:  p.designation  ?? '',
          categorie_id: String(p.categorie_id ?? ''),
          etat:         p.etat         ?? 'neuf',
          description:  p.description  ?? '',
        })

        setPrixForm({
          prix_achat:   String(p.prix_achat   ?? ''),
          prix_vente:   String(p.prix_vente   ?? ''),
          seuil_alerte: String(p.seuil_alerte ?? 0),
        })

        setFournisseurForm({
          fournisseur_id:        null,
          fournisseur_nom:       p.fournisseur_nom       ?? '',
          fournisseur_telephone: p.fournisseur_telephone ?? '',
          fournisseur_contact:   p.fournisseur_contact   ?? '',
          fournisseur_notes:     p.fournisseur_notes     ?? '',
        })

        setHasVariantes(p.has_variantes)

        if (p.has_variantes && p.variantes) {
          setVariantes(p.variantes.map((v: {
            attributs:    Record<string, string>
            prix_achat:   number
            prix_vente:   number
            seuil_alerte: number
          }) => ({
            attributs:     v.attributs    ?? {},
            prix_achat:    String(v.prix_achat   ?? ''),
            prix_vente:    String(v.prix_vente   ?? ''),
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
        ...infoForm,
        ...fournisseurForm,
        categorie_id:  infoForm.categorie_id ? Number(infoForm.categorie_id) : null,
        prix_achat:    Number(prixForm.prix_achat),
        prix_vente:    hasVariantes ? 0 : Number(prixForm.prix_vente),
        seuil_alerte:  Number(prixForm.seuil_alerte),
        has_variantes: hasVariantes,
        stock_initial: hasVariantes ? undefined : Number(stockInitial),
        variantes: hasVariantes ? variantes.map(v => ({
          attributs:     v.attributs,
          prix_achat:    v.prix_achat    ? Number(v.prix_achat)    : null,
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
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Mettre à jour les informations' : 'Remplissez les informations du produit'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <InfoGeneralesSection
          form={infoForm}
          onChange={setInfo}
          categories={categories}
          hasVariantes={hasVariantes}
          isEdit={isEdit}
          onToggleVariantes={() => {
            if (hasVariantes) setVariantes([])
            setHasVariantes(v => !v)
          }}
        />

        <PrixSection
          form={prixForm}
          onChange={setPrix}
          hasVariantes={hasVariantes}
        />

        <FournisseurSection
          boutiqueId={id}
          form={fournisseurForm}
          onChange={setFournisseur}
        />

        <StockVariantesSection
          hasVariantes={hasVariantes}
          isEdit={isEdit}
          stockInitial={stockInitial}
          seuilAlerte={prixForm.seuil_alerte}
          variantes={variantes}
          attributsDisponibles={attributs}
          onStockInitialChange={setStockInitial}
          onSeuilAlerteChange={v => setPrix('seuil_alerte', v)}
          onVariantesChange={setVariantes}
        />

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