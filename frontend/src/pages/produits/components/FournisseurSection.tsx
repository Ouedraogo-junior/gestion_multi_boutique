// src/pages/produits/components/FournisseurSection.tsx
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { getFournisseurs, type Fournisseur } from '@/api/approvisionnements'

export interface FournisseurFormState {
  fournisseur_id:        number | null   
  fournisseur_nom:       string
  fournisseur_telephone: string
  fournisseur_contact:   string
  fournisseur_notes:     string
}

interface Props {
  boutiqueId: number
  form: FournisseurFormState
  onChange: (k: keyof FournisseurFormState, v: string | number | null) => void
}

export default function FournisseurSection({ boutiqueId, form, onChange }: Props) {
  const [fournisseurs,  setFournisseurs]  = useState<Fournisseur[]>([])
  const [search,        setSearch]        = useState('')
  const [showDropdown,  setShowDropdown]  = useState(false)
  const [selected,      setSelected]      = useState<Fournisseur | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Charger les fournisseurs existants
  useEffect(() => {
  getFournisseurs(boutiqueId).then(res => {
    console.log('fournisseurs chargés:', res.data)
    setFournisseurs(res.data)
  })
}, [boutiqueId])

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtres = fournisseurs.filter(f =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (f: Fournisseur) => {
    setSelected(f)
    setSearch(f.nom)
    setShowDropdown(false)
    onChange('fournisseur_id',        f.id)      
    onChange('fournisseur_nom',       f.nom)
    onChange('fournisseur_telephone', f.telephone  ?? '')
    onChange('fournisseur_contact',   f.adresse    ?? '')
    onChange('fournisseur_notes',     f.notes      ?? '')
  }

  const handleClear = () => {
    setSelected(null)
    setSearch('')
    onChange('fournisseur_id',        null)   
    onChange('fournisseur_nom',       '')
    onChange('fournisseur_telephone', '')
    onChange('fournisseur_contact',   '')
    onChange('fournisseur_notes',     '')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>
      <Separator />

      {/* Autocomplétion fournisseur existant */}
      <div className="space-y-1" ref={dropdownRef}>
        <Label className="text-sm text-gray-500">
          Rechercher un fournisseur existant
        </Label>
        <div className="relative">
          <Input
            value={selected ? selected.nom : search}
            onChange={e => {
              setSearch(e.target.value)
              setSelected(null)
              onChange('fournisseur_nom', e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Nom du fournisseur..."
          />
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
          {showDropdown && filtres.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
              {filtres.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelect(f)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F4F6F5] text-sm"
                >
                  <span className="font-medium">{f.nom}</span>
                  {f.telephone  && <span className="text-gray-400 ml-2 text-xs">{f.telephone}</span>}
                  {f.provenance && <span className="text-gray-400 ml-2 text-xs">· {f.provenance}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Sélectionnez un fournisseur existant ou saisissez manuellement ci-dessous
        </p>
      </div>

      {/* Champs manuels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nom fournisseur</Label>
          <Input
            value={form.fournisseur_nom}
            onChange={e => {
              onChange('fournisseur_nom', e.target.value)
              if (selected) setSelected(null)
            }}
            placeholder="Ex: TechDistrib"
          />
        </div>
        <div className="space-y-1">
          <Label>Téléphone</Label>
          <Input
            value={form.fournisseur_telephone}
            onChange={e => onChange('fournisseur_telephone', e.target.value)}
            placeholder="Ex: 70000000"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Contact / Adresse</Label>
        <Input
          value={form.fournisseur_contact}
          onChange={e => onChange('fournisseur_contact', e.target.value)}
          placeholder="Ex: Rue 10, Ouagadougou"
        />
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          value={form.fournisseur_notes}
          onChange={e => onChange('fournisseur_notes', e.target.value)}
          rows={2}
          placeholder="Observations, conditions..."
        />
      </div>
    </div>
  )
}