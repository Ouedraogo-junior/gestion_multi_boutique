import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, RotateCcw } from 'lucide-react'

interface Action {
  label: string
  sub: string
  icon: React.ElementType
  color: string
  path: string
}

interface Props {
  boutiqueId: number
  role: 'admin_boutique' | 'vendeur'
}

export default function AccesRapides({ boutiqueId, role }: Props) {
  const navigate = useNavigate()
  const base = `/boutiques/${boutiqueId}`

  const adminActions: Action[] = [
    { label: 'Nouvelle vente',  sub: 'Créer une vente',    icon: ShoppingCart, color: '#1A7A4A', path: `${base}/ventes/nouvelle` },
    { label: 'Entrée en stock', sub: 'Approvisionner',     icon: Package,      color: '#29ABE2', path: `${base}/produits`        },
  ]

  const vendeurActions: Action[] = [
    { label: 'Nouvelle vente',  sub: 'Créer une vente',    icon: ShoppingCart, color: '#1A7A4A', path: `${base}/ventes/nouvelle` },
    { label: 'Entrée en stock', sub: 'Approvisionner',     icon: Package,      color: '#29ABE2', path: `${base}/produits`        },
    { label: 'Nouveau retour',  sub: 'Enregistrer retour', icon: RotateCcw,    color: '#E8314A', path: `${base}/retours`         },
  ]

  const actions = role === 'admin_boutique' ? adminActions : vendeurActions

  return (
    <div className={`grid grid-cols-${actions.length} gap-4`}>
      {actions.map(a => {
        const Icon = a.icon
        return (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex items-center justify-between group text-left"
          >
            <div>
              <p className="text-sm font-medium text-[#1C1C1C]">{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: a.color + '20' }}
            >
              <Icon size={20} style={{ color: a.color }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}