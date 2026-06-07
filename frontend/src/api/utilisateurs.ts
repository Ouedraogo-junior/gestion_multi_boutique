import api from './axios'

export interface Utilisateur {
  id: number
  nom: string
  prenom: string
  pseudo: string
  role: 'admin_boutique' | 'vendeur'
  boutique_id: number
  actif: boolean
  created_at: string
  updated_at: string
}

export const getUtilisateurs = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/users`, { params })

export const createUtilisateur = (boutiqueId: number, data: Record<string, unknown>) =>
  api.post(`/boutiques/${boutiqueId}/users`, data)

export const updateUtilisateur = (boutiqueId: number, id: number, data: Record<string, unknown>) =>
  api.put(`/boutiques/${boutiqueId}/users/${id}`, data)

export const toggleUtilisateur = (boutiqueId: number, id: number) =>
  api.patch(`/boutiques/${boutiqueId}/users/${id}/toggle-actif`)

export const resetPassword = (boutiqueId: number, id: number, data: { password: string; password_confirmation: string }) =>
  api.post(`/boutiques/${boutiqueId}/users/${id}/reset-password`, data)