import api from './axios'

export interface Referentiel {
  id: number
  boutique_id: number
  type: string
  libelle: string
  actif: boolean
  ordre: number
}

export const getReferentiels = (boutiqueId: number, type?: string) =>
  api.get<Referentiel[]>(`/boutiques/${boutiqueId}/referentiels`, { params: { type } })

export const createReferentiel = (boutiqueId: number, data: Partial<Referentiel>) =>
  api.post(`/boutiques/${boutiqueId}/referentiels`, data)

export const updateReferentiel = (boutiqueId: number, id: number, data: Partial<Referentiel>) =>
  api.put(`/boutiques/${boutiqueId}/referentiels/${id}`, data)

export const deleteReferentiel = (boutiqueId: number, id: number) =>
  api.delete(`/boutiques/${boutiqueId}/referentiels/${id}`)