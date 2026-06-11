// src/pages/approvisionnements/components/FournisseurPanel.tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Fournisseur } from '@/api/approvisionnements'
import type { FournisseurState } from '../ReceptionMarchandisesPage'

interface Props {
  fournisseurs: Fournisseur[]
  state: FournisseurState
  onChange: (state: FournisseurState) => void
}

export default function FournisseurPanel({ fournisseurs, state, onChange }: Props) {
  const [showDropdown, setShowDropdown] = useState(false)

  const filtres = fournisseurs.filter(f =>
    f.nom.toLowerCase().includes(state.nom.toLowerCase())
  )

  const selectionner = (f: Fournisseur) => {
    onChange({
      ...state,
      fournisseur_id: f.id,
      nom: f.nom,
      telephone: f.telephone ?? '',
      provenance: f.provenance ?? '',
      adresse: f.adresse ?? '',
      isNew: false,
    })
    setShowDropdown(false)
  }

  const basculerNouveauFournisseur = () => {
    onChange({ fournisseur_id: null, nom: '', telephone: '', provenance: '', adresse: '', isNew: true })
  }

  const basculerExistant = () => {
    onChange({ fournisseur_id: null, nom: '', telephone: '', provenance: '', adresse: '', isNew: false })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-800">Fournisseur</h2>

      {!state.isNew ? (
        <div className="space-y-3">
          <div className="relative">
            <Label>Rechercher un fournisseur existant</Label>
            <Input
              className="mt-1"
              placeholder="Nom du fournisseur..."
              value={state.nom}
              onChange={e => {
                onChange({ ...state, fournisseur_id: null, nom: e.target.value })
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && filtres.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtres.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onMouseDown={() => selectionner(f)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F4F6F5] text-sm"
                  >
                    <span className="font-medium">{f.nom}</span>
                    {f.telephone && (
                      <span className="text-gray-400 ml-2 text-xs">{f.telephone}</span>
                    )}
                    {f.provenance && (
                      <span className="text-gray-400 ml-2 text-xs">· {f.provenance}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {state.fournisseur_id && (
            <p className="text-xs text-[#1A7A4A] font-medium">
              ✓ Fournisseur sélectionné : {state.nom}
            </p>
          )}
          <button
            type="button"
            onClick={basculerNouveauFournisseur}
            className="text-sm text-[#1A7A4A] hover:underline"
          >
            + Nouveau fournisseur
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input
                value={state.nom}
                onChange={e => onChange({ ...state, nom: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-1">
              <Label>Téléphone</Label>
              <Input
                value={state.telephone}
                onChange={e => onChange({ ...state, telephone: e.target.value })}
                placeholder="Ex: 70000000"
              />
            </div>
            <div className="space-y-1">
              <Label>Provenance</Label>
              <Input
                value={state.provenance}
                onChange={e => onChange({ ...state, provenance: e.target.value })}
                placeholder="Ex: Chine, Dubai..."
              />
            </div>
            <div className="space-y-1">
              <Label>Adresse</Label>
              <Input
                value={state.adresse}
                onChange={e => onChange({ ...state, adresse: e.target.value })}
                placeholder="Adresse"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={basculerExistant}
            className="text-sm text-gray-400 hover:underline"
          >
            ← Utiliser un fournisseur existant
          </button>
        </div>
      )}
    </div>
  )
}