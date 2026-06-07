import api from './axios'

export type Depense = {
  id: number
  boutique_id: number
  categorie_id: number | null
  montant: number
  description: string | null
  date: string
  user_id: number
  created_at: string
  updated_at: string
  categorie: { id: number; libelle: string } | null
  user: { id: number; nom: string; prenom: string; pseudo: string }
}

export type DepensePayload = {
  categorie_id?: number | null
  montant: number
  description?: string
  date: string
}

export const getDepenses  = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/depenses`, { params })

export const createDepense = (boutiqueId: number, data: DepensePayload) =>
  api.post(`/boutiques/${boutiqueId}/depenses`, data)

export const updateDepense = (boutiqueId: number, id: number, data: Partial<DepensePayload>) =>
  api.put(`/boutiques/${boutiqueId}/depenses/${id}`, data)

export const deleteDepense = (boutiqueId: number, id: number) =>
  api.delete(`/boutiques/${boutiqueId}/depenses/${id}`)