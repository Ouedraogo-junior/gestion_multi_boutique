import api from './axios'

export interface BoutiqueOption {
  id: number
  nom: string
}

export interface TransfertLignePayload {
  variante_id: number
  quantite: number
  prix_unitaire?: number
}

export interface TransfertPayload {
  boutique_destination_id: number
  note?: string
  montant_convenu?: number
  lignes: TransfertLignePayload[]
  paiement?: {
    montant: number
    mode: 'especes' | 'mobile_money' | 'avance_client'
    operateur_id?: number | null
    client_avance_id?: number | null
    reference_paiement?: string
    date_paiement: string
    note?: string
  }
}

export interface TransfertLigne {
  id: number
  transfert_boutique_id: number
  variante_id: number
  quantite: number
  prix_unitaire: string
  variante: {
    id: number
    attributs: Record<string, string> | null
    produit: { id: number; designation: string; reference: string }
  }
}

export interface TransfertBoutique {
  id: number
  boutique_source_id: number
  boutique_destination_id: number
  user_id: number
  reference: string
  statut: 'valide' | 'annule'
  note: string | null
  montant_calcule: string
  montant_convenu: string | null
  created_at: string
  boutique_source: { id: number; nom: string }
  boutique_destination: { id: number; nom: string }
  user: { id: number; nom: string; prenom: string; pseudo: string }
  lignes: TransfertLigne[]
  montant_du?: number
  solde_restant?: number
  statut_paiement?: 'non_paye' | 'partiel' | 'solde'
}

export interface PaiementTransfertPayload {
  montant: number
  mode: 'especes' | 'mobile_money' | 'avance_client'
  operateur_id?: number | null
  client_avance_id?: number | null
  reference_paiement?: string
  date_paiement: string
  note?: string
}

export interface PaiementTransfert {
  id: number
  montant: string
  mode: 'especes' | 'mobile_money' | 'avance_client'
  reference_paiement: string | null
  date_paiement: string
  note: string | null
  created_at: string
  user: { id: number; nom: string; prenom: string; pseudo: string }
  operateur: { id: number; libelle: string } | null
}

export interface SoldeTransfert {
  transfert_id: number
  reference: string
  boutique_destination: { id: number; nom: string }
  montant_calcule: string
  montant_convenu: string | null
  montant_du: number
  montant_paye: number
  solde_restant: number
  statut_paiement: 'non_paye' | 'partiel' | 'solde'
  versements: PaiementTransfert[]
}

export interface AvanceDisponible {
  disponible: boolean
  client_id?: number
  client_nom?: string
  solde_avance?: number
}

export const getBoutiquesDisponibles = (boutiqueId: number) =>
  api.get<BoutiqueOption[]>(`/boutiques/${boutiqueId}/transferts-boutiques/boutiques-disponibles`)

export const getTransferts = (boutiqueId: number, params?: Record<string, unknown>) =>
  api.get<{ data: TransfertBoutique[] }>(`/boutiques/${boutiqueId}/transferts-boutiques`, { params })

export const createTransfert = (boutiqueId: number, data: TransfertPayload) =>
  api.post<TransfertBoutique>(`/boutiques/${boutiqueId}/transferts-boutiques`, data)

export const getTransfert = (boutiqueId: number, id: number) =>
  api.get<TransfertBoutique>(`/boutiques/${boutiqueId}/transferts-boutiques/${id}`)

export const getSoldeTransfert = (boutiqueId: number, transfertId: number) =>
  api.get<SoldeTransfert>(`/boutiques/${boutiqueId}/transferts-boutiques/${transfertId}/paiements`)

export const createPaiementTransfert = (boutiqueId: number, transfertId: number, data: PaiementTransfertPayload) =>
  api.post<{
    paiement: PaiementTransfert
    montant_du: number
    montant_paye: number
    solde_restant: number
    statut_paiement: 'non_paye' | 'partiel' | 'solde'
  }>(`/boutiques/${boutiqueId}/transferts-boutiques/${transfertId}/paiements`, data)

export const getAvanceDisponible = (boutiqueId: number, transfertId: number) =>
  api.get<AvanceDisponible>(`/boutiques/${boutiqueId}/transferts-boutiques/${transfertId}/avance-disponible`)

export const getAvanceDisponiblePourBoutique = (boutiqueId: number, boutiqueDestinationId: number) =>
  api.get<AvanceDisponible>(`/boutiques/${boutiqueId}/transferts-boutiques/avance-disponible/${boutiqueDestinationId}`)