import api from './axios'

export interface Parametre {
  id: number
  cle: string
  valeur: string
  groupe: string
}

export const getParametres  = (boutiqueId: number) =>
  api.get<{ data: Parametre[] }>(`/boutiques/${boutiqueId}/parametres`)

export const saveParametres = (boutiqueId: number, parametres: { cle: string; valeur: string }[]) =>
  api.put(`/boutiques/${boutiqueId}/parametres`, { parametres })