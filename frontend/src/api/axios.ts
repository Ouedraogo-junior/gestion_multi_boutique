// axios.ts
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  //baseURL: 'http://localhost:8001/api',
  baseURL: 'https://api-hamedtelecom.fasodev.com/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const boutiqueId = localStorage.getItem('boutique_active_id')
  const boutiqueIdParsed = parseInt(boutiqueId ?? '')
  
  // N'envoyer le header que si c'est un entier valide et positif
  if (!isNaN(boutiqueIdParsed) && boutiqueIdParsed > 0) {
    config.headers['X-Boutique-ID'] = boutiqueIdParsed
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }

    const code = err.response?.data?.code
    if (code === 'BOUTIQUE_REQUIRED' || code === 'BOUTIQUE_NOT_FOUND') {
      toast.warning('Aucune boutique sélectionnée', {
        description: err.response.data.message,
        duration: 5000,
      })
    }

    return Promise.reject(err)
  }
)

export default api