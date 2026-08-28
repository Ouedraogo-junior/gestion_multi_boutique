import { useLocation, useNavigate } from 'react-router-dom'
import { useBoutique } from '@/hooks/useBoutique'
import { useState } from 'react'
import ProfileEditModal from './ProfileEditModal'
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Receipt, BarChart3, Settings, LogOut, X,
  Store, FileText, RotateCcw, ClipboardList, Truck, Wallet, Activity, ArrowLeftRight, Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  path: string
  icon: React.ElementType
  label: string
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { boutiqueActive } = useBoutique()
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const boutiqueId = user?.role === ROLES.SUPER_ADMIN
  ? boutiqueActive?.id
  : user?.boutique_id


  const base = `/boutiques/${boutiqueId}`


//   console.log('user:', user)
// console.log('boutiqueId:', user?.boutique_id)

  const superAdminItemsAvecBoutique: MenuItem[] = [
    { path: `${base}/ventes`, icon: ShoppingCart, label: 'Ventes'},
    { path: `${base}/activites`, icon: Activity, label: 'Activités'},
    { path: `${base}/produits`,     icon: Package,         label: 'Produits'},
    { path: `${base}/clients`,      icon: Users,         label: 'Clients & Dettes' },
    { path: `${base}/fournisseurs`, icon: Building2,     label: 'Fournisseurs' },
    { path: `${base}/dettes-fournisseurs`, icon: Wallet, label: 'Dettes fournisseurs' },
    { path: `${base}/transferts-boutiques`, icon: ArrowLeftRight, label: 'Transferts boutiques' },
    { path: `${base}/rapports`,     icon: BarChart3,     label: 'Rapports' },
    { path: `${base}/utilisateurs`, icon: Users,         label: 'Utilisateurs' },
    { path: `${base}/audit`,        icon: ClipboardList, label: 'Audit' },
    { path: `${base}/parametres`,   icon: Settings,      label: 'Paramètres' },
  ]

  // Items Super Admin toujours visibles
  const superAdminItemsGlobaux: MenuItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { path: '/boutiques', icon: Store,           label: 'Boutiques' },
  ]

  const superAdminItems: MenuItem[] = boutiqueActive
    ? [...superAdminItemsGlobaux, ...superAdminItemsAvecBoutique]
    : superAdminItemsGlobaux

  const adminItems: MenuItem[] = [
    { path: `${base}/dashboard`,    icon: LayoutDashboard, label: 'Tableau de bord'},
    { path: `${base}/ventes`, icon: ShoppingCart, label: 'Ventes'},
    { path: `${base}/activites`, icon: Activity, label: 'Activités'},
    { path: `${base}/produits`,     icon: Package,         label: 'Produits'},
    { path: `${base}/approvisionnements`, icon: Truck,     label: 'Approvisionnements'},
    { path: `${base}/fournisseurs`, icon: Building2,       label: 'Fournisseurs'},
    { path: `${base}/dettes-fournisseurs`, icon: Wallet, label: 'Dettes fournisseurs' },
    { path: `${base}/transferts-boutiques`, icon: ArrowLeftRight, label: 'Transferts boutiques' },
    { path: `${base}/clients`,      icon: Users,           label: 'Clients & Dettes'},
    { path: `${base}/depenses`,     icon: Receipt,         label: 'Dépenses'},
    { path: `${base}/retours`,      icon: RotateCcw,       label: 'Retours'},
    { path: `${base}/rapports`,     icon: BarChart3,       label: 'Rapports'},
    { path: `${base}/utilisateurs`, icon: Users,           label: 'Utilisateurs'},
    { path: `${base}/audit`,        icon: ClipboardList,   label: 'Audit'},
    { path: `${base}/parametres`,   icon: Settings,        label: 'Paramètres'},
  ]

  const vendeurItems: MenuItem[] = [
    { path: `${base}/dashboard`,    icon: LayoutDashboard, label: 'Tableau de bord'},
    { path: `${base}/ventes`,          icon: FileText,    label: 'Mes ventes'},
    { path: `${base}/activites`, icon: Activity, label: 'Activités'},
    { path: `${base}/ventes/nouvelle`, icon: ShoppingCart,label: 'Nouvelle vente'},
    { path: `${base}/produits`,        icon: Package,     label: 'Produits'},
    { path: `${base}/approvisionnements`, icon: Truck, label: 'Approvisionnements'},
    { path: `${base}/dettes-fournisseurs`, icon: Wallet, label: 'Dettes fournisseurs' },
    { path: `${base}/transferts-boutiques`, icon: ArrowLeftRight, label: 'Transferts boutiques' },
    { path: `${base}/clients`,         icon: Users,       label: 'Clients'},
    { path: `${base}/retours`,         icon: RotateCcw,   label: 'Retours'},
  ]

  const menuItems =
    user?.role === ROLES.SUPER_ADMIN ? superAdminItems :
    user?.role === ROLES.ADMIN_BOUTIQUE ? adminItems :
    vendeurItems

  const roleLabel =
    user?.role === ROLES.SUPER_ADMIN ? 'Super Admin' :
    user?.role === ROLES.ADMIN_BOUTIQUE ? 'Administration' :
    'Vendeur'

  const logoUrl = boutiqueActive?.logo_url ?? user?.boutique?.logo_url ?? null
  const nomBoutique = boutiqueActive?.nom ?? user?.boutique?.nom ?? 'Hamed Telecom'

  const handleNav = (path: string) => {
    navigate(path)
    onClose()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 relative">
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 absolute top-4 right-4">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-29 h-17 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#1A7A4A] flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {nomBoutique.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-center">
              <h1 className="text-sm text-[#1A7A4A] font-medium">{nomBoutique}</h1>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-[#D4F0E2] text-[#145C38] font-medium'
                    : 'text-gray-600 hover:bg-[#F4F6F5]'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}

          {/* Message si Super Admin sans boutique sélectionnée */}
          {user?.role === ROLES.SUPER_ADMIN && !boutiqueActive && (
            <div className="mt-4 mx-1 p-3 rounded-lg border border-dashed border-[#1A7A4A]/30 bg-[#F4F6F5]">
              <div className="flex items-center gap-2 mb-1">
                <Store size={14} className="text-[#1A7A4A]" />
                <p className="text-xs font-medium text-[#1A7A4A]">Aucune boutique active</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sélectionnez une boutique en haut de l'écran pour accéder à ses données.
              </p>
            </div>
          )}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F4F6F5] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#1A7A4A] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-medium">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.pseudo}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#E8314A] hover:bg-red-50 transition-colors text-sm"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <ProfileEditModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </>
  )
}