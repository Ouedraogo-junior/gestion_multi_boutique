import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import SectionBoutique from './components/SectionBoutique'
import SectionPassword from './components/SectionPassword'
import SectionReferentiels from './components/SectionReferentiels'

export default function ParametresPage() {
  const { boutiqueId } = useParams()
  console.log('boutiqueId from params:', boutiqueId)
  const { user } = useAuth()

  const id = Number(boutiqueId)

  if (!id || isNaN(id)) {
    return (
      <div className="p-8 text-gray-400 text-center">
        Aucune boutique sélectionnée
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Configuration de la boutique</p>
      </div>

      {user?.role !== ROLES.VENDEUR && <SectionBoutique boutiqueId={id} />}
      <SectionPassword />
      {user?.role !== ROLES.VENDEUR && <SectionReferentiels boutiqueId={id} />}
    </div>
  )
}