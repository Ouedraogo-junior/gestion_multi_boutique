export const formatMontant = (montant: number | null | undefined): string =>
  new Intl.NumberFormat('fr-FR').format(montant ?? 0) + ' FCFA'

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDateCourte = (date: string | Date | null | undefined): string => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const formatNom = (prenom?: string | null, nom?: string | null) =>
  [prenom, nom].filter(Boolean).join(' ') || '—'