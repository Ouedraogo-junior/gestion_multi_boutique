import { useContext } from 'react'
import { BoutiqueContext } from '../contexts/BoutiqueContext'

export function useBoutique() {
  const ctx = useContext(BoutiqueContext)
  if (!ctx) throw new Error('useBoutique doit être utilisé dans BoutiqueProvider')
  return ctx
}