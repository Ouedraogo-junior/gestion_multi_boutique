import { useEffect, useState } from 'react'
import { Menu, ChevronDown, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBoutique } from '@/hooks/useBoutique'
import { ROLES } from '@/utils/constants'
import { getBoutiques } from '@/api/boutiques'
import type { Boutique } from '@/contexts/BoutiqueContext'
import ProfileEditModal from './ProfileEditModal'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth()
  const { boutiqueActive, setBoutiqueActive } = useBoutique()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [boutiques,    setBoutiques]    = useState<Boutique[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [profileModalOpen, setProfileModalOpen] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) return
    getBoutiques().then(res => {
      const data = res.data?.data ?? res.data
      setBoutiques(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [isSuperAdmin])

  const handleSelect = (boutique: Boutique) => {
    setBoutiqueActive(boutique)
    setDropdownOpen(false)
    navigate(`/boutiques/${boutique.id}/dashboard`)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>

        {/* Sélecteur boutique Super Admin */}
        {isSuperAdmin && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
            >
              <Store size={16} className="text-[#1A7A4A]" />
              <span className="text-gray-700">
                {boutiqueActive ? boutiqueActive.nom : 'Sélectionner une boutique'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {dropdownOpen && (
              <>
                {/* Overlay pour fermer */}
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {boutiques.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-400">Aucune boutique</p>
                  ) : (
                    boutiques.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleSelect(b)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F6F5] transition-colors ${
                          boutiqueActive?.id === b.id ? 'text-[#1A7A4A] font-medium' : 'text-gray-700'
                        }`}
                      >
                        {b.nom}
                        {!b.actif && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* User info */}
      <button
        onClick={() => setProfileModalOpen(true)}
        className="flex items-center gap-3 hover:bg-[#F4F6F5] rounded-lg px-2 py-1.5 transition-colors"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
          <p className="text-xs text-gray-500">{user?.pseudo}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1A7A4A] flex items-center justify-center">
          <span className="text-white text-xs font-medium">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </span>
        </div>
      </button>
      <ProfileEditModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </header>
  )
}