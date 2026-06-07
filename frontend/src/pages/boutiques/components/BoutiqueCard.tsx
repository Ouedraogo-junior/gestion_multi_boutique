import { Building2, Phone, MapPin, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import type { Boutique } from '@/contexts/BoutiqueContext'

interface Props {
  boutique: Boutique
  onEdit:   (b: Boutique) => void
  onToggle: (b: Boutique) => void
}

export default function BoutiqueCard({ boutique, onEdit, onToggle }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4F0E2] flex items-center justify-center">
            <Building2 size={20} className="text-[#1A7A4A]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{boutique.nom}</h3>
            {boutique.slogan && (
              <p className="text-xs text-gray-500 mt-0.5">{boutique.slogan}</p>
            )}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          boutique.actif
            ? 'bg-[#D4F0E2] text-[#145C38]'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {boutique.actif ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        {boutique.adresse && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span>{boutique.adresse}</span>
          </div>
        )}
        {boutique.telephone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span>{boutique.telephone}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(boutique)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <Pencil size={14} />
          Modifier
        </button>
        <button
          onClick={() => onToggle(boutique)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            boutique.actif
              ? 'border-red-100 text-[#E8314A] hover:bg-red-50'
              : 'border-green-100 text-[#1A7A4A] hover:bg-green-50'
          }`}
        >
          {boutique.actif
            ? <><ToggleLeft size={14} /> Désactiver</>
            : <><ToggleRight size={14} /> Activer</>
          }
        </button>
      </div>
    </div>
  )
}