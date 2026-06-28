// src/api/ventes.ts
import api from './axios'

export interface VenteDetailPayload {
  variante_id: number
  quantite: number
  prix_applique: number
  remise_montant: number
}

export interface PaiementPayload {
  mode: 'especes' | 'mobile_money' | 'credit'
  operateur_id?: number | null
  montant: number
}

export interface VentePayload {
  client_id?: number | null
  lignes: VenteDetailPayload[]
  paiements: PaiementPayload[]
  note?: string
  valider?: boolean
}

export interface VenteDetail {
  id: number
  variante_id: number
  quantite: number
  prix_catalogue: number
  prix_applique: number
  remise_montant: number
  variante?: {
    attributs: Record<string, string> | null
    stock_actuel: number
    seuil_alerte: number
    prix_vente: number
    produit?: {
      id: number
      designation: string
      reference: string
    }
  }
}

export interface Vente {
  id: number
  boutique_id: number
  client_id: number | null
  vendeur_id: number
  statut: 'brouillon' | 'validee' | 'annulee'
  numero_facture: string | null
  total_brut: number
  total_remise: number
  total_net: number
  note: string | null
  date_validation: string | null
  created_at: string
  details?: VenteDetail[]
  paiements?: {
    id: number
    mode: 'especes' | 'mobile_money' | 'credit'
    montant: number
    operateur_id: number | null
  }[]
  client?: { nom: string; prenom: string | null; telephone?: string | null }
  vendeur?: { nom: string; prenom: string; pseudo: string }
}

export const getVentes    = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/ventes`, { params })

export const getVente     = (boutiqueId: number, id: number) =>
  api.get(`/boutiques/${boutiqueId}/ventes/${id}`)

export const createVente  = (boutiqueId: number, data: VentePayload) =>
  api.post(`/boutiques/${boutiqueId}/ventes`, data)

export const updateVente = (boutiqueId: number, id: number, data: VentePayload) =>
  api.put(`/boutiques/${boutiqueId}/ventes/${id}`, data)

export const validerVente = (boutiqueId: number, id: number, paiements: PaiementPayload[]) =>
  api.post(`/boutiques/${boutiqueId}/ventes/${id}/valider`, { paiements })

export const annulerVente = (boutiqueId: number, id: number) =>
  api.post(`/boutiques/${boutiqueId}/ventes/${id}/annuler`)