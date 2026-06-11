import { createContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface Boutique {
  id: number
  nom: string
  adresse?: string
  telephone?: string
  logo?: string
  logo_url?: string
  logo_base64?: string | null
  slogan?: string
  ncc?: string | null
  actif: boolean
  mention_legale?: string
}

interface BoutiqueContextType {
  boutiqueActive: Boutique | null
  setBoutiqueActive: (boutique: Boutique | null) => void
}

export const BoutiqueContext = createContext<BoutiqueContextType | null>(null)

export function BoutiqueProvider({ children }: { children: ReactNode }) {
  const [boutiqueActive, setBoutiqueActiveState] = useState<Boutique | null>(() => {
    const stored = localStorage.getItem('boutique_active')
    return stored ? JSON.parse(stored) : null
  })

  const setBoutiqueActive = (boutique: Boutique | null) => {
    setBoutiqueActiveState(boutique)
    if (boutique) {
      localStorage.setItem('boutique_active', JSON.stringify(boutique))
      localStorage.setItem('boutique_active_id', String(boutique.id))
    } else {
      localStorage.removeItem('boutique_active')
      localStorage.removeItem('boutique_active_id')
    }
  }

  return (
    <BoutiqueContext.Provider value={{ boutiqueActive, setBoutiqueActive }}>
      {children}
    </BoutiqueContext.Provider>
  )
}