import api from './axios'

export type RetourDetail = {
  id: number
  retour_id: number
  variante_id: number
  quantite: number
  variante: {
    id: number
    attributs: Record<string, string> | null
    prix_vente: number
    produit: { id: number; designation: string; reference: string }
  }
}

export type Retour = {
  id: number
  boutique_id: number
  vente_id: number
  user_id: number
  motif_id: number | null
  mode_remboursement: 'especes' | 'avoir' | 'mobile_money'
  operateur_id: number | null
  montant_rembourse: number
  note: string | null
  created_at: string
  vente: {
    id: number
    numero_facture: string | null
    total_net: number
    statut: string
  }
  user: { id: number; nom: string; prenom: string }
  motif: { id: number; libelle: string } | null
  details: RetourDetail[]
}

export type RetourPayload = {
  vente_id: number
  motif_id?: number | null
  mode_remboursement: 'especes' | 'avoir' | 'mobile_money'
  operateur_id?: number | null
  montant_rembourse: number
  note?: string
  lignes: { variante_id: number; quantite: number }[]
}

export const getRetours  = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/retours`, { params })

export const getRetour   = (boutiqueId: number, id: number) =>
  api.get(`/boutiques/${boutiqueId}/retours/${id}`)

export const createRetour = (boutiqueId: number, data: RetourPayload) =>
  api.post(`/boutiques/${boutiqueId}/retours`, data)