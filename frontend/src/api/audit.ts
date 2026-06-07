import api from './axios'

export interface AuditLog {
  id: number
  boutique_id: number | null
  user_id: number
  user_pseudo: string
  user_nom: string
  action: string
  module: string
  details: Record<string, unknown> | null
  ip_address: string
  created_at: string
}

export const getAuditBoutique = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/audit`, { params })

export const getAuditGlobal = (params?: Record<string, unknown>) =>
  api.get(`/audit`, { params })