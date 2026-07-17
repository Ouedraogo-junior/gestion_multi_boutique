import api from './axios'

export interface Client {
  id: number
  boutique_id: number
  nom: string
  prenom?: string | null
  telephone?: string | null
  adresse?: string | null
  notes?: string | null
  est_boutique?: boolean
  represente_boutique_id?: number | null
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

export interface DetteInitiale {
  dette_initiale_id: number
  date: string
  montant_initial: number
  note?: string | null
  total_paye: number
  solde_restant: number
}

export interface DetteInitialeCreated {
  id: number
  boutique_id: number
  client_id: number
  montant: number
  date: string
  note?: string | null
  user_id: number
  created_at: string
}

export interface DettesResponse {
  client: Client
  total_dette: number
  dettes: Dette[]
  dettes_initiales: DetteInitiale[]
}

export interface PaiementPayload {
  vente_id: number
  montant: number
  mode: 'especes' | 'mobile_money' | 'avance_client'
  operateur_id?: number | null
  note?: string
  date: string
}

export interface DetteInitialePayload {
  montant: number
  date: string
  note?: string
}

export interface PaiementDetteInitialePayload {
  montant: number
  mode: 'especes' | 'mobile_money' | 'avance_client'
  operateur_id?: number | null
  note?: string
  date: string
}

export interface PaiementHistorique {
  id?: number
  vente_id?: number
  dette_initiale_id?: number
  source?: 'vente' | 'dette_initiale'
  montant: number
  mode: 'especes' | 'mobile_money' | 'avance_client'
  date: string
  note?: string | null
  vente?: {
    numero_facture: string
    total_net: number
    solde_restant: number
  }
  dette_initiale?: {
    solde_restant: number
  }
}

// --- Avances clients ---

export interface AvanceEntry {
  id: number
  boutique_id: number
  client_id: number
  type: 'depot' | 'utilisation'
  montant: number
  vente_id?: number | null
  mode_depot?: 'especes' | 'mobile_money' | null
  operateur_id?: number | null
  user_id: number
  note?: string | null
  created_at: string
  vente?: {
    id: number
    numero_facture: string
    total_net: number
  } | null
}

export interface AvancesResponse {
  client: Client
  solde_avance: number
  historique: AvanceEntry[]
}

export interface AvanceDepotPayload {
  montant: number
  mode_depot: 'especes' | 'mobile_money'
  operateur_id?: number | null
  note?: string
}

export interface AvanceDepotResponse {
  avance: AvanceEntry
  solde_avance_apres: number
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
  api.get<DettesResponse>(`/boutiques/${boutiqueId}/clients/${id}/dettes`)

export const storePaiement  = (boutiqueId: number, id: number, data: PaiementPayload) =>
  api.post(`/boutiques/${boutiqueId}/clients/${id}/paiements`, data)

export const getPaiements = (boutiqueId: number, clientId: number) =>
  api.get<PaiementHistorique[]>(`/boutiques/${boutiqueId}/clients/${clientId}/paiements`)

export const getClientStats = (boutiqueId: number) =>
  api.get(`/boutiques/${boutiqueId}/clients/stats`)

export const getDerniersPaiements = (boutiqueId: number, clientIds: number[]) =>
  api.get(`/boutiques/${boutiqueId}/clients/derniers-paiements`, {
     params: { client_ids: clientIds },
   })

export const storeDetteInitiale = (boutiqueId: number, id: number, data: DetteInitialePayload) =>
  api.post<DetteInitialeCreated>(`/boutiques/${boutiqueId}/clients/${id}/dettes-initiales`, data)

export const storePaiementDetteInitiale = (
  boutiqueId: number, id: number, detteInitialeId: number, data: PaiementDetteInitialePayload
) =>
  api.post(`/boutiques/${boutiqueId}/clients/${id}/dettes-initiales/${detteInitialeId}/paiements`, data)


// --- Avances ---

export const getAvances    = (boutiqueId: number, id: number) =>
  api.get<AvancesResponse>(`/boutiques/${boutiqueId}/clients/${id}/avances`)

export const storeAvance   = (boutiqueId: number, id: number, data: AvanceDepotPayload) =>
  api.post<AvanceDepotResponse>(`/boutiques/${boutiqueId}/clients/${id}/avances`, data)