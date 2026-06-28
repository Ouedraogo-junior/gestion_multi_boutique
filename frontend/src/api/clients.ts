import api from './axios'

export interface Client {
  id: number
  boutique_id: number
  nom: string
  prenom?: string | null
  telephone?: string | null
  adresse?: string | null
  notes?: string | null
  total_dette?: number
  total_achat?: number | string
  total_paye?: number | string
}

export interface Dette {
  vente_id: number
  numero_facture: string
  date_validation: string
  total_net: number
  total_credit: number
  total_paye: number
  solde_restant: number
}

export interface DettesResponse {
  client: Client
  total_dette: number
  dettes: Dette[]
}

export interface PaiementPayload {
  vente_id: number
  montant: number
  mode: 'especes' | 'mobile_money'
  operateur_id?: number | null
  note?: string
  date: string
}

export interface PaiementHistorique {
  id?: number
  vente_id?: number
  montant: number
  mode: 'especes' | 'mobile_money'
  date: string
  note?: string | null
  vente?: {
    numero_facture: string
    total_net: number
    solde_restant: number
  }
}

export const getClients     = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/clients`, { params })

export const getClient      = (boutiqueId: number, id: number) =>
  api.get(`/boutiques/${boutiqueId}/clients/${id}`)

export const createClient   = (boutiqueId: number, data: Partial<Client>) =>
  api.post(`/boutiques/${boutiqueId}/clients`, data)

export const updateClient   = (boutiqueId: number, id: number, data: Partial<Client>) =>
  api.put(`/boutiques/${boutiqueId}/clients/${id}`, data)

export const getDettes      = (boutiqueId: number, id: number) =>
  api.get(`/boutiques/${boutiqueId}/clients/${id}/dettes`)

export const storePaiement  = (boutiqueId: number, id: number, data: PaiementPayload) =>
  api.post(`/boutiques/${boutiqueId}/clients/${id}/paiements`, data)

export const getPaiements = (boutiqueId: number, clientId: number) =>
  api.get<PaiementHistorique[]>(`/boutiques/${boutiqueId}/clients/${clientId}/paiements`)