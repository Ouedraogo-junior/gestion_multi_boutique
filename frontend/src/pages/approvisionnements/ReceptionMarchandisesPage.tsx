// src/pages/approvisionnements/ReceptionMarchandisesPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBoutique } from '@/hooks/useBoutique'
import { getReferentiels } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getFournisseurs,
  createFournisseur,
  createApprovisionnement,
  type Fournisseur,
  type Approvisionnement,
} from '@/api/approvisionnements'
import { createProduit } from '@/api/produits'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMontant } from '@/utils/format'

import FournisseurPanel from './components/FournisseurPanel'
import ListeLignesReception from './components/ListeLignesReception'
import ModalCreationProduit from './components/ModalCreationProduit'
import RecuApprovisionnement from './components/RecuApprovisionnement'
import { Printer } from 'lucide-react'

export interface LigneReception {
  // identifiant temporaire pour React key
  _key: string
  // null = produit à créer (nouveau)
  variante_id: number | null
  label: string
  reference: string
  quantite: number
  prix_achat: number
  // données de création si nouveau produit
  isNew: boolean
  newProduitPayload?: Record<string, unknown>
}

export interface FournisseurState {
  fournisseur_id: number | null
  nom: string
  telephone: string
  provenance: string
  adresse: string
  isNew: boolean
}

export default function ReceptionMarchandisesPage() {
  const { boutiqueId } = useParams()
  const navigate = useNavigate()
  const { boutiqueActive } = useBoutique()
  const id = Number(boutiqueId)

  // ── Référentiels ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Referentiel[]>([])
  const [attributs, setAttributs] = useState<Referentiel[]>([])

  useEffect(() => {
    getReferentiels(id, 'categorie_produit').then(r =>
      setCategories(Array.isArray(r.data) ? r.data : [])
    )
    getReferentiels(id, 'attribut_variante').then(r =>
      setAttributs(Array.isArray(r.data) ? r.data : [])
    )
  }, [id])

  // ── Fournisseur ───────────────────────────────────────────────────────────────
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [fournisseurState, setFournisseurState] = useState<FournisseurState>({
    fournisseur_id: null,
    nom: '',
    telephone: '',
    provenance: '',
    adresse: '',
    isNew: false,
  })

  useEffect(() => {
    getFournisseurs(id).then(r => setFournisseurs(r.data))
  }, [id])

  // ── Lignes ────────────────────────────────────────────────────────────────────
  const [lignes, setLignes] = useState<LigneReception[]>([])
  const [note, setNote] = useState('')

  const ajouterLigneVide = () => {
    setLignes(prev => [...prev, {
      _key: crypto.randomUUID(),
      variante_id: null,
      label: '',
      reference: '',
      quantite: 1,
      prix_achat: 0,
      isNew: false,
    }])
  }

  const [montantTotalFacture, setMontantTotalFacture] = useState<number | null>(null)

  const supprimerLigne = (key: string) =>
    setLignes(prev => prev.filter(l => l._key !== key))

  const updateLigne = (key: string, patch: Partial<LigneReception>) =>
    setLignes(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l))

  // ── Modal création produit ────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  // clé de la ligne qui a déclenché le modal (pour y attacher le produit créé)
  const [modalLigneKey, setModalLigneKey] = useState<string | null>(null)
  const [modalSearch, setModalSearch] = useState('')
  const [modalPayloadInitial, setModalPayloadInitial] = useState<Record<string, unknown> | null>(null)

  const ouvrirModal = (ligneKey: string, searchTerm: string, payloadExistant?: Record<string, unknown>) => {
    setModalLigneKey(ligneKey)
    setModalSearch(searchTerm)
    setModalPayloadInitial(payloadExistant ?? null)
    setModalOpen(true)
  }

  /**
   * Appelé par ModalCreationProduit quand l'utilisateur valide la création locale.
   * On n'appelle pas l'API ici — on stocke le payload pour l'envoyer à la validation finale.
   * Les variantes sont dans payload.variantes avec leur stock_initial.
   * Pour un produit simple : payload.stock_initial est dans la ligne.
   */
  const handleProduitCree = (payload: Record<string, unknown>, label: string) => {
    if (!modalLigneKey) return

    // Pour un produit simple on prend le stock_initial du payload comme quantité par défaut
    const quantiteDefaut = payload.has_variantes
      ? 0 // pour variantes, le stock est par variante dans le modal — on met 0 en ligne car géré dans payload
      : Number(payload.stock_initial) || 1

    updateLigne(modalLigneKey, {
      variante_id: null,
      label,
      reference: '(nouveau)',
      quantite: quantiteDefaut,
      prix_achat: Number(payload.prix_achat) || 0,
      isNew: true,
      newProduitPayload: payload,
    })
    setModalOpen(false)
    setModalLigneKey(null)
  }

  // ── Soumission ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [recuDialog, setRecuDialog] = useState(false)
  const [approFinal, setApproFinal] = useState<Approvisionnement | null>(null)
  const recuRef = useRef<HTMLDivElement>(null)
  const [pretAPrint, setPretAPrint] = useState(false)

  useEffect(() => {
    if (pretAPrint && approFinal && recuRef.current) {
      setPretAPrint(false)
      handlePrint()
    }
  }, [pretAPrint, approFinal])

  const handlePrint = useReactToPrint({
    contentRef: recuRef,
    pageStyle: `@page { size: A5; margin: 10mm; } body { margin: 0; -webkit-print-color-adjust: exact; }`,
    onAfterPrint: () => {
      setRecuDialog(false)
      setApproFinal(null)
      navigate(`/boutiques/${id}/approvisionnements`)
    },
  })

  const valider = async () => {
    //console.log('lignes isNew:', lignes.filter(l => l.isNew).map(l => l.label))
    if (lignes.length === 0) {
      toast.error('Ajoutez au moins un produit')
      return
    }
    const lignesIncompletes = lignes.filter(l => !l.label.trim())
    if (lignesIncompletes.length > 0) {
      toast.error('Toutes les lignes doivent avoir un produit sélectionné ou créé')
      return
    }
    if (!fournisseurState.fournisseur_id && !fournisseurState.nom.trim()) {
      toast.error('Sélectionnez ou renseignez un fournisseur')
      return
    }

    setLoading(true)
    try {
      // 1. Résoudre le fournisseur
      let fournisseurId = fournisseurState.fournisseur_id
      if (!fournisseurId && fournisseurState.nom.trim()) {
        const rf = await createFournisseur(id, {
          nom: fournisseurState.nom,
          telephone: fournisseurState.telephone || undefined,
          provenance: fournisseurState.provenance || undefined,
          adresse: fournisseurState.adresse || undefined,
        })
        fournisseurId = rf.data.id
      }

      // 2. Créer les nouveaux produits et récupérer leurs variantes
      const lignesAppro: { variante_id: number; quantite: number; prix_achat: number }[] = []

      for (const ligne of lignes) {
        if (ligne.isNew && ligne.newProduitPayload) {
          // Appel création produit
          //console.log('Tentative création produit:', ligne.newProduitPayload.designation)
          const rp = await createProduit(id, {
            ...ligne.newProduitPayload,
            stock_initial: 0,          // ← forcer à 0
            variantes: ligne.newProduitPayload?.has_variantes
              ? (ligne.newProduitPayload.variantes as Array<Record<string, unknown>>).map(v => ({
                  ...v,
                  stock_initial: 0,    // ← idem pour les variantes
                }))
              : undefined,
            fournisseur_nom: fournisseurState.nom || undefined,
            fournisseur_telephone: fournisseurState.telephone || undefined,
            fournisseur_contact: fournisseurState.adresse || undefined,
            fournisseur_notes: undefined,
          })
          const produitCree = rp.data

          // Construire les lignes appro depuis les variantes créées
          for (const v of produitCree.variantes ?? []) {
            const payload = ligne.newProduitPayload

            let stockInitial = 0
            let prixAchat = 0

            if (payload.has_variantes && Array.isArray(payload.variantes)) {
              // Retrouver la variante correspondante par attributs
              const varSource = (payload.variantes as Array<{
                attributs: Record<string, string>
                stock_initial?: number
                prix_achat?: number
              }>).find(pv =>
                JSON.stringify(pv.attributs) === JSON.stringify(v.attributs)
              )
              stockInitial = Number(varSource?.stock_initial) || 0
              prixAchat = Number(varSource?.prix_achat) || 0
            } else {
              stockInitial = Number(payload.stock_initial) || 0
              prixAchat = Number(payload.prix_achat) || 0
            }

            if (stockInitial > 0) {
              lignesAppro.push({
                variante_id: v.id,
                quantite: stockInitial,
                prix_achat: prixAchat,
              })
            }
          }
        } else if (ligne.variante_id !== null) {
          // Produit existant
          if (ligne.quantite > 0) {
            lignesAppro.push({
              variante_id: ligne.variante_id,
              quantite: ligne.quantite,
              prix_achat: ligne.prix_achat,
            })
          }
        }
      }

      if (lignesAppro.length === 0) {
        toast.error('Aucune ligne avec une quantité valide')
        setLoading(false)
        return
      }

      // 3. Créer l'approvisionnement
      const ra = await createApprovisionnement(id, {
        fournisseur_id: fournisseurId!,
        note: note || undefined,
        montant_total_facture: montantTotalFacture ?? undefined,
        lignes: lignesAppro,
      })

      setApproFinal(ra.data)
      setRecuDialog(true)
      setPretAPrint(true)
      toast.success(`Réception ${ra.data.reference} enregistrée`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const totalGeneral = lignes.reduce((s, l) => {
    if (l.isNew && l.newProduitPayload?.has_variantes && Array.isArray(l.newProduitPayload.variantes)) {
      return s + (l.newProduitPayload.variantes as Array<{ prix_achat?: number; stock_initial?: number }>)
        .reduce((sv, v) => sv + (Number(v.prix_achat) || 0) * (Number(v.stock_initial) || 0), 0)
    }
    return s + l.prix_achat * l.quantite
  }, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/boutiques/${id}/approvisionnements`)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Réception de marchandises</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Recherchez un produit existant ou créez-en un nouveau à la volée
          </p>
        </div>
      </div>

      {/* Fournisseur */}
      <FournisseurPanel
        fournisseurs={fournisseurs}
        state={fournisseurState}
        onChange={setFournisseurState}
      />

      {/* Lignes */}
      <ListeLignesReception
        lignes={lignes}
        boutiqueId={id}
        totalGeneral={totalGeneral}
        onAjouterLigne={ajouterLigneVide}
        onSupprimerLigne={supprimerLigne}
        onUpdateLigne={updateLigne}
        onOuvrirModal={ouvrirModal}
        note={note}
        onNoteChange={setNote}
      />

      {/* Paiement fournisseur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-base font-medium text-gray-800">Paiement fournisseur</h2>
        <div className="max-w-sm space-y-1">
          <Label>Montant total facturé (optionnel)</Label>
          <Input
            type="number"
            min={0}
            value={montantTotalFacture ?? ''}
            onChange={e => setMontantTotalFacture(e.target.value ? Number(e.target.value) : null)}
            placeholder="Laisser vide = calculé automatiquement"
          />
          {totalGeneral > 0 && (
            <p className="text-xs text-gray-400">
              Montant calculé : <strong>{formatMontant(totalGeneral)}</strong>
              {montantTotalFacture !== null && montantTotalFacture !== totalGeneral && (
                <span className="ml-2 text-amber-500">
                  (écart : {formatMontant(Math.abs(montantTotalFacture - totalGeneral))})
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => navigate(`/boutiques/${id}/approvisionnements`)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <Button
          onClick={valider}
          disabled={loading || lignes.length === 0}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          {loading ? 'Enregistrement...' : 'Valider la réception'}
        </Button>
      </div>

      {/* Modal création produit */}
      <ModalCreationProduit
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        boutiqueId={id}
        categories={categories}
        attributs={attributs}
        searchInitial={modalSearch}
        onConfirm={handleProduitCree}
        payloadInitial={modalPayloadInitial}
      />

      {/* Reçu monté hors écran */}
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
            <DialogTitle>Réception enregistrée</DialogTitle>
          </DialogHeader>
          {approFinal && boutiqueActive && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-gray-500 text-center">
                Réf : <strong>{approFinal.reference}</strong> — {formatMontant(
                  Number(approFinal.montant_total_facture ?? approFinal.montant_calcule)
                )}
              </p>

              {/* Statut paiement */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-center">
                <span className="text-amber-700 font-medium">Non payé</span>
                <span className="text-amber-600 ml-2">
                  — Solde : {formatMontant(Number(approFinal.montant_total_facture ?? approFinal.montant_calcule))}
                </span>
              </div>

              <Button
                onClick={() => setPretAPrint(true)}
                className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
              >
                <Printer size={18} className="mr-2" />
                Imprimer le reçu
              </Button>

              <Button
                variant="outline"
                className="w-full border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2]"
                onClick={() => {
                  setRecuDialog(false)
                  navigate(`/boutiques/${id}/approvisionnements/${approFinal.id}/paiements`)
                }}
              >
                Enregistrer un versement
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