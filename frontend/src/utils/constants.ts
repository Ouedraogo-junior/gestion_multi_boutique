export const ROLES = {
  SUPER_ADMIN:    'super_admin',
  ADMIN_BOUTIQUE: 'admin_boutique',
  VENDEUR:        'vendeur',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const STATUTS_VENTE = {
  BROUILLON: 'brouillon',
  VALIDEE:   'validee',
  ANNULEE:   'annulee',
} as const

export const MODES_PAIEMENT = {
  ESPECES:      'especes',
  MOBILE_MONEY: 'mobile_money',
  CREDIT:       'credit',
} as const

export const TYPES_REFERENTIEL = {
  CATEGORIE_PRODUIT: 'categorie_produit',
  ATTRIBUT_VARIANTE: 'attribut_variante',
  CATEGORIE_DEPENSE: 'categorie_depense',
  OPERATEUR_MM:      'operateur_mm',
  MOTIF_RETOUR:      'motif_retour',
  MODE_PAIEMENT_FOURNISSEUR: 'mode_paiement_fournisseur',
} as const

export const TYPES_MOUVEMENT = {
  ENTREE:     'entree',
  SORTIE:     'sortie',
  RETOUR:     'retour',
  AJUSTEMENT: 'ajustement',
} as const