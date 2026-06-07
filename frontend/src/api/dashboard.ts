import api from './axios'

export const getDashboardBoutique = (boutiqueId: number) =>
  api.get(`/boutiques/${boutiqueId}/dashboard`)

export const getDashboardGlobal = () =>
  api.get(`/dashboard`)