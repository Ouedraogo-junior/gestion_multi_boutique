// src/pages/produits/ImportMassePage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createProduit } from '@/api/produits'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import FournisseurSection from './components/FournisseurSection'
import type { FournisseurFormState } from './components/FournisseurSection'
import LigneImport from './components/LigneImport'
import type { LigneProduit } from './components/LigneImport'
import { ligneVide } from './components/LigneImport'
import ResultatsImport from './components/ResultatsImport'
import type { ResultatLigne } from './components/ResultatsImport'
import { formatMontant } from '@/utils/format'
import { createFournisseur, createApprovisionnement } from '@/api/approvisionnements'

export default function ImportMassePage() {
  const { boutiqueId } = useParams()
  const navigate        = useNavigate()
  const id              = Number(boutiqueId)

  const [categories,    setCategories]    = useState<Referentiel[]>([])
  const [attributs,     setAttributs]     = useState<Referentiel[]>([])
  const [lignes,        setLignes]        = useState<LigneProduit[]>([ligneVide()])
  const [loading,       setLoading]       = useState(false)
  const [resultats,     setResultats]     = useState<ResultatLigne[]>([])
  const [done,          setDone]          = useState(false)

  const [fournisseurForm, setFournisseurForm] = useState<FournisseurFormState>({
    fournisseur_id:        null,
    fournisseur_nom:       '',
    fournisseur_telephone: '',
    fournisseur_contact:   '',
    fournisseur_notes:     '',
  })

  const setFournisseur = (k: keyof FournisseurFormState, v: string | number | null) =>
    setFournisseurForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    getReferentiels(id, 'categorie_produit').then(res => {
      setCategories(Array.isArray(res.data) ? res.data : [])
    })
    getReferentiels(id, 'attribut_variante').then(res => {
      setAttributs(Array.isArray(res.data) ? res.data : [])
    })
  }, [id])

  useEffect(() => {
  console.log('fournisseurForm:', fournisseurForm)
}, [fournisseurForm])

  const updateLigne = (i: number, k: keyof LigneProduit, v: unknown) => {
    setLignes(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  }

  const ajouterLigne  = () => setLignes(prev => [...prev, ligneVide()])
  const supprimerLigne = (i: number) => {
    if (lignes.length === 1) return
    setLignes(prev => prev.filter((_, idx) => idx !== i))
  }

  // Calcul valeur stock corrigé
  const totalAchat = lignes.reduce((s, l) => {
    if (l.has_variantes) {
      return s + l.variantes.reduce((sv, v) =>
        sv + (Number(v.prix_achat) || 0) * (Number(v.stock_initial) || 0), 0
      )
    }
    return s + (Number(l.prix_achat) || 0) * (Number(l.stock_initial) || 0)
  }, 0)

  const handleSubmit = async () => {
    const lignesValides = lignes.filter(l => l.designation.trim())
    if (lignesValides.length === 0) {
      toast.error('Ajoutez au moins un produit avec une désignation')
      return
    }

    setLoading(true)
    const res: ResultatLigne[] = []
    const lignesAppro: { variante_id: number; quantite: number; prix_achat: number }[] = []

    for (const ligne of lignesValides) {
      try {
        const r = await createProduit(id, {
          designation:   ligne.designation.trim(),
          categorie_id:  ligne.categorie_id ? Number(ligne.categorie_id) : null,
          etat:          ligne.etat,
          prix_achat:    ligne.has_variantes ? 0 : Number(ligne.prix_achat) || 0,
          prix_vente:    ligne.has_variantes ? 0 : Number(ligne.prix_vente) || 0,
          seuil_alerte:  Number(ligne.seuil_alerte) || 0,
          stock_initial: ligne.has_variantes ? undefined : Number(ligne.stock_initial) || 0,
          has_variantes: ligne.has_variantes,
          variantes: ligne.has_variantes ? ligne.variantes.map(v => ({
            attributs:     v.attributs,
            prix_achat:    v.prix_achat    ? Number(v.prix_achat)    : null,
            prix_vente:    v.prix_vente    ? Number(v.prix_vente)    : null,
            seuil_alerte:  v.seuil_alerte  ? Number(v.seuil_alerte)  : 0,
            stock_initial: v.stock_initial ? Number(v.stock_initial) : 0,
          })) : undefined,
          fournisseur_nom:       fournisseurForm.fournisseur_nom       || undefined,
          fournisseur_telephone: fournisseurForm.fournisseur_telephone || undefined,
          fournisseur_contact:   fournisseurForm.fournisseur_contact   || undefined,
          fournisseur_notes:     fournisseurForm.fournisseur_notes     || undefined,
        })

        // Collecter les variantes créées pour l'approvisionnement
        const produitCree = r.data
        if (produitCree.variantes) {
          for (const v of produitCree.variantes) {
            const stockInitial = ligne.has_variantes
              ? Number(ligne.variantes.find(lv =>
                  JSON.stringify(lv.attributs) === JSON.stringify(v.attributs)
                )?.stock_initial) || 0
              : Number(ligne.stock_initial) || 0

            const prixAchat = ligne.has_variantes
              ? Number(ligne.variantes.find(lv =>
                  JSON.stringify(lv.attributs) === JSON.stringify(v.attributs)
                )?.prix_achat) || 0
              : Number(ligne.prix_achat) || 0

            if (stockInitial > 0) {
              lignesAppro.push({
                variante_id: v.id,
                quantite:    stockInitial,
                prix_achat:  prixAchat,
              })
            }
          }
        }

        res.push({ designation: ligne.designation, ok: true, ref: produitCree.reference })
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        res.push({ designation: ligne.designation, ok: false, erreur: msg })
      }
    }

    // Créer l'approvisionnement si fournisseur renseigné et lignes avec stock
    if (fournisseurForm.fournisseur_nom && lignesAppro.length > 0) {
      try {
        let fournisseurId = fournisseurForm.fournisseur_id

        // Créer le fournisseur s'il est nouveau
        if (!fournisseurId) {
          const rf = await createFournisseur(id, {
            nom:       fournisseurForm.fournisseur_nom,
            telephone: fournisseurForm.fournisseur_telephone || undefined,
            adresse:   fournisseurForm.fournisseur_contact   || undefined,
            notes:     fournisseurForm.fournisseur_notes     || undefined,
          })
          fournisseurId = rf.data.id
        }

        await createApprovisionnement(id, {
          fournisseur_id: fournisseurId,
          lignes:         lignesAppro,
        })
      } catch {
        toast.error('Produits créés mais erreur lors de la création de l\'approvisionnement')
      }
    }

    setResultats(res)
    setDone(true)
    setLoading(false)

    const nbOk  = res.filter(r => r.ok).length
    const nbErr = res.filter(r => !r.ok).length
    if (nbErr === 0) toast.success(`${nbOk} produit${nbOk > 1 ? 's' : ''} créé${nbOk > 1 ? 's' : ''} avec succès`)
    else             toast.error(`${nbOk} réussi${nbOk > 1 ? 's' : ''}, ${nbErr} échoué${nbErr > 1 ? 's' : ''}`)
  }

  // ── Écran résultats ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/boutiques/${id}/produits`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl text-[#1C1C1C]">Résultats de l'import</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {resultats.filter(r => r.ok).length} / {resultats.length} produits créés
            </p>
          </div>
        </div>

        <ResultatsImport
          resultats={resultats}
          boutiqueId={id}
          onRetry={lignesEchec => {
            setLignes(lignesEchec)
            setResultats([])
            setDone(false)
          }}
          onNavigate={() => navigate(`/boutiques/${id}/produits`)}
        />
      </div>
    )
  }

  // ── Formulaire principal ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/boutiques/${id}/produits`)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Ajout en masse</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Créez plusieurs produits en une seule opération
          </p>
        </div>
      </div>

      {/* Fournisseur commun */}
      <FournisseurSection
        boutiqueId={id}
        form={fournisseurForm}
        onChange={setFournisseur}
      />

      {/* Tableau des produits */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-800">
            Produits
            <span className="ml-2 text-sm text-gray-400 font-normal">
              {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
            </span>
          </h2>
          <Button
            type="button"
            onClick={ajouterLigne}
            variant="outline"
            className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2] gap-2"
          >
            <Plus size={16} /> Ajouter une ligne
          </Button>
        </div>

        {/* En-têtes colonnes */}
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1">
          <div className="col-span-3">Désignation *</div>
          <div className="col-span-2">Catégorie</div>
          <div className="col-span-1">État</div>
          <div className="col-span-1">Prix achat</div>
          <div className="col-span-2">Prix vente</div>
          <div className="col-span-1">Seuil</div>
          <div className="col-span-1">Stock init.</div>
          <div className="col-span-1"></div>
        </div>

        {/* Lignes */}
        <div className="space-y-2">
          {lignes.map((ligne, i) => (
            <LigneImport
              key={i}
              index={i}
              ligne={ligne}
              categories={categories}
              attributsDisponibles={attributs.map(a => a.libelle)}
              canDelete={lignes.length > 1}
              onChange={updateLigne}
              onDelete={supprimerLigne}
            />
          ))}
        </div>

        {/* Pied de tableau */}
        <div className="flex justify-end pt-3 border-t border-gray-100 gap-6 text-sm">
          <span className="text-gray-400">
            {lignes.filter(l => l.designation.trim()).length} produit
            {lignes.filter(l => l.designation.trim()).length > 1 ? 's' : ''} à créer
          </span>
          <span className="text-gray-500">
            Valeur totale stock :
            <span className="ml-2 font-semibold text-[#1A7A4A]">
              {formatMontant(totalAchat)}
            </span>
          </span>
        </div>
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
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          {loading
            ? 'Création en cours...'
            : `Créer ${lignes.filter(l => l.designation.trim()).length} produit${lignes.filter(l => l.designation.trim()).length > 1 ? 's' : ''}`
          }
        </Button>
      </div>

    </div>
  )
}