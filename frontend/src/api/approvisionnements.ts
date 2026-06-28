// src/api/approvisionnements.ts
import api from './axios'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FournisseurPayload {
  nom: string
  telephone?: string
  adresse?: string
  provenance?: string
  notes?: string
}

export interface Fournisseur {
  id: number
  boutique_id: number
  nom: string
  telephone: string | null
  adresse: string | null
  provenance: string | null
  notes: string | null
  actif: boolean
  created_at: string
  updated_at: string
}

export interface ApproLignePayload {
  variante_id: number
  quantite: number
  prix_achat?: number
}

export interface ApprovisionnementPayload {
  fournisseur_id: number
  note?: string
  montant_total_facture?: number  
  lignes: ApproLignePayload[]
}

export interface ApproLigne {
  id: number
  approvisionnement_id: number
  variante_id: number
  quantite: number
  prix_achat: string
  variante: {
    id: number
    attributs: Record<string, string> | null
    prix_vente: number
    stock_actuel: number
    produit: {
      id: number
      designation: string
      reference: string
    }
  }
}

export interface Approvisionnement {
  id: number
  boutique_id: number
  fournisseur_id: number
  user_id: number
  reference: string
  statut: 'brouillon' | 'valide'        
  note: string | null
  montant_calcule: string
  solde_restant?: number     
  montant_total_facture: string | null   
  created_at: string
  updated_at: string
  fournisseur: Fournisseur
  user: { id: number; nom: string; prenom: string; pseudo: string }
  lignes: ApproLigne[]
  statut_paiement?: 'non_paye' | 'partiel' | 'solde'
}

export interface PaiementFournisseurPayload {
  montant: number
  mode_paiement_id: number
  reference_paiement?: string
  date_paiement: string
  note?: string
}

export interface PaiementFournisseur {
  id: number
  boutique_id: number
  approvisionnement_id: number
  user_id: number
  mode_paiement_id: number
  montant: string
  reference_paiement: string | null
  date_paiement: string
  note: string | null
  created_at: string
  mode_paiement: { id: number; libelle: string }
  user: { id: number; nom: string; prenom: string; pseudo: string }
}

export interface SoldeFournisseur {
  approvisionnement_id: number
  reference: string
  fournisseur: Fournisseur
  montant_calcule: string
  montant_total_facture: string | null
  montant_du: number
  montant_paye: number
  solde_restant: number
  statut_paiement: 'non_paye' | 'partiel' | 'solde'
  versements: PaiementFournisseur[]
}

// ─── Fournisseurs ─────────────────────────────────────────────────────────────

export const getFournisseurs = (boutiqueId: number, params?: Record<string, string>) =>
  api.get<Fournisseur[]>(`/boutiques/${boutiqueId}/fournisseurs`, { params })

export const createFournisseur = (boutiqueId: number, data: FournisseurPayload) =>
  api.post<Fournisseur>(`/boutiques/${boutiqueId}/fournisseurs`, data)

export const updateFournisseur = (boutiqueId: number, id: number, data: Partial<FournisseurPayload>) =>
  api.put<Fournisseur>(`/boutiques/${boutiqueId}/fournisseurs/${id}`, data)

export const getSoldeFournisseur = (boutiqueId: number, approId: number) =>
  api.get<SoldeFournisseur>(`/boutiques/${boutiqueId}/approvisionnements/${approId}/paiements`)

// ─── Approvisionnements ───────────────────────────────────────────────────────

export const getApprovisionnements = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get<{ data: Approvisionnement[] }>(`/boutiques/${boutiqueId}/approvisionnements`, { params })

export const createApprovisionnement = (boutiqueId: number, data: ApprovisionnementPayload) =>
  api.post<Approvisionnement>(`/boutiques/${boutiqueId}/approvisionnements`, data)

export const getApprovisionnement = (boutiqueId: number, id: number) =>
  api.get<Approvisionnement>(`/boutiques/${boutiqueId}/approvisionnements/${id}`)

export const createPaiementFournisseur = (boutiqueId: number, approId: number, data: PaiementFournisseurPayload) =>
  api.post<{ paiement: PaiementFournisseur 
    montant_du: number
    montant_paye: number
    solde_restant: number
    statut_paiement: 'non_paye' | 'partiel' | 'solde'
  }>(`/boutiques/${boutiqueId}/approvisionnements/${approId}/paiements`, data)