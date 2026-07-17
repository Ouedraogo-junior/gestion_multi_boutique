import api from './axios'

export type ActiviteType =
  | 'vente'
  | 'dette_initiale'
  | 'paiement_vente'
  | 'paiement_dette_initiale'
  | 'avance_depot'
  | 'avance_utilisation'

export interface ActiviteItem {
  type: ActiviteType
  id: number
  date: string
  client_nom: string | null
  montant: number
  numero_facture: string | null
  mode: 'especes' | 'mobile_money' | null
  note: string | null
  // Présents uniquement si type === 'vente'
  credit_accorde?: number
  cash?: number
  rembourse?: number
  reste_du?: number
  categorie?: 'reglee' | 'partielle' | 'credit_total'
}

export interface ActivitesResponse {
  data: ActiviteItem[]
  current_page: number
  last_page: number
  total: number
}

export const getActivites = (
  boutiqueId: number,
  params: { debut: string; fin: string; per_page?: number; page?: number }
) => api.get<ActivitesResponse>(`/boutiques/${boutiqueId}/activites`, { params })