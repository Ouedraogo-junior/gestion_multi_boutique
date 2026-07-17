import api from './axios'

export const getRapportCA       = (boutiqueId: number, params: Record<string, string>) =>
  api.get(`/boutiques/${boutiqueId}/rapports/ca`, { params })

export const getRapportStock    = (boutiqueId: number) =>
  api.get(`/boutiques/${boutiqueId}/rapports/stock`)

export const getRapportDettes = (boutiqueId: number, params: Record<string, string>) =>
  api.get(`/boutiques/${boutiqueId}/rapports/dettes`, { params })

export const getRapportDepenses = (boutiqueId: number, params: Record<string, string>) =>
  api.get(`/boutiques/${boutiqueId}/rapports/depenses`, { params })

export const getRapportConsolide = (params: Record<string, string>) =>
  api.get(`/rapports/consolide`, { params })

export const exportRapport = (boutiqueId: number, params: Record<string, string>) =>
  api.get(`/boutiques/${boutiqueId}/rapports/export`, { params, responseType: 'blob' })

export const exportConsolide = (params: Record<string, string>) =>
  api.get(`/rapports/consolide/export`, { params, responseType: 'blob' })