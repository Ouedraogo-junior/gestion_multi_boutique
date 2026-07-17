import api from './axios'

export interface Variante {
  id: number
  produit_id: number
  boutique_id: number
  attributs: Record<string, string> | null
  prix_achat: number | null
  prix_vente: number | null
  stock_actuel: number
  seuil_alerte: number
  est_defaut: boolean
  actif: boolean
}

export interface Produit {
  id: number
  boutique_id: number
  reference: string
  designation: string
  categorie_id: number | null
  photo: string | null
  prix_achat: number
  prix_vente: number
  description: string | null
  etat: 'neuf' | 'occasion'
  fournisseur_nom: string | null
  fournisseur_contact: string | null
  fournisseur_telephone: string | null
  fournisseur_notes: string | null
  seuil_alerte: number
  has_variantes: boolean
  actif: boolean
  variantes?: Variante[]
}

export interface MouvementStock {
  id: number
  variante_id: number
  type: string
  quantite: number
  source: string
  note: string | null
  created_at: string
  user?: { nom: string; prenom: string }
}

export interface AjustementStockPayload {
  variante_id: number
  nouveau_stock: number
  note: string
}

export interface AjustementStockResponse {
  variante_id: number
  ancien_stock: number
  stock_actuel: number
  ecart: number
}

export const getProduits    = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/produits`, { params })

export const getProduit     = (boutiqueId: number, id: number) =>
  api.get(`/boutiques/${boutiqueId}/produits/${id}`)

export const createProduit  = (boutiqueId: number, data: unknown) =>
  api.post(`/boutiques/${boutiqueId}/produits`, data)

export const updateProduit  = (boutiqueId: number, id: number, data: unknown) =>
  api.put(`/boutiques/${boutiqueId}/produits/${id}`, data)

export const ajusterStock = (boutiqueId: number, data: AjustementStockPayload) =>
  api.post<AjustementStockResponse>(`/boutiques/${boutiqueId}/stock/ajustement`, data)

export const toggleProduit  = (boutiqueId: number, id: number) =>
  api.patch(`/boutiques/${boutiqueId}/produits/${id}/toggle-actif`)

export const deleteProduit = (boutiqueId: number, id: number) =>
  api.delete(`/boutiques/${boutiqueId}/produits/${id}`)

export const addVariante    = (boutiqueId: number, produitId: number, data: unknown) =>
  api.post(`/boutiques/${boutiqueId}/produits/${produitId}/variantes`, data)

export const updateVariante = (boutiqueId: number, id: number, data: unknown) =>
  api.put(`/boutiques/${boutiqueId}/variantes/${id}`, data)

export const deleteVariante = (boutiqueId: number, id: number) =>
  api.delete(`/boutiques/${boutiqueId}/variantes/${id}`)

export const entreeStock    = (boutiqueId: number, data: unknown) =>
  api.post(`/boutiques/${boutiqueId}/stock/entree`, data)

export const getMouvements  = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get(`/boutiques/${boutiqueId}/stock/mouvements`, { params })

export const getAlertes     = (boutiqueId: number) =>
  api.get(`/boutiques/${boutiqueId}/stock/alertes`)