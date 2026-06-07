import api from './axios'
import type { Boutique } from '@/contexts/BoutiqueContext'

export const getBoutiques  = ()             => api.get('/boutiques')
export const getBoutique   = (id: number)   => api.get(`/boutiques/${id}`)
export const createBoutique = (data: Partial<Boutique> | FormData) => {
  if (data instanceof FormData) {
    return api.post('/boutiques', data, {
      headers: { 'Content-Type': undefined }
    })
  }
  return api.post('/boutiques', data)
}
export const updateBoutique = (id: number, data: Partial<Boutique> | FormData) => {
  if (data instanceof FormData) {
    return api.post(`/boutiques/${id}`, data, {
      headers: { 'Content-Type': undefined }  // ← laisse axios détecter multipart
    })
  }
  return api.put(`/boutiques/${id}`, data)
}
export const toggleBoutique= (id: number)  => api.patch(`/boutiques/${id}/toggle-actif`)