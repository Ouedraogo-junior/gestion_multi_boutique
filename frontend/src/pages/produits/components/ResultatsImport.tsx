// src/pages/produits/components/ResultatsImport.tsx
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LigneProduit } from './LigneImport'
import { ligneVide } from './LigneImport'

export interface ResultatLigne {
  designation: string
  ok:          boolean
  ref?:        string
  erreur?:     string
}

interface Props {
  resultats:    ResultatLigne[]
  boutiqueId:   number
  onRetry:      (lignes: LigneProduit[]) => void
  onNavigate:   () => void
}

export default function ResultatsImport({
  resultats,
  onRetry,
  onNavigate,
}: Props) {
  const nbOk  = resultats.filter(r => r.ok).length
  const nbErr = resultats.filter(r => !r.ok).length

  const handleRetry = () => {
    const lignesEchec = resultats
      .filter(r => !r.ok)
      .map(r => ({ ...ligneVide(), designation: r.designation }))
    onRetry(lignesEchec)
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#D4F0E2] rounded-xl p-5 text-center">
          <p className="text-3xl font-semibold text-[#1A7A4A]">{nbOk}</p>
          <p className="text-sm text-[#145C38] mt-1">
            Produit{nbOk > 1 ? 's' : ''} créé{nbOk > 1 ? 's' : ''}
          </p>
        </div>
        <div className={`rounded-xl p-5 text-center ${nbErr > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-3xl font-semibold ${nbErr > 0 ? 'text-[#E8314A]' : 'text-gray-300'}`}>
            {nbErr}
          </p>
          <p className={`text-sm mt-1 ${nbErr > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            Échec{nbErr > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Liste détaillée */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {resultats.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            {r.ok ? (
              <CheckCircle size={18} className="text-[#1A7A4A] flex-shrink-0" />
            ) : (
              <XCircle size={18} className="text-[#E8314A] flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1C1C1C] truncate">{r.designation}</p>
              {r.erreur && (
                <p className="text-xs text-red-400 mt-0.5">{r.erreur}</p>
              )}
            </div>

            {r.ref && (
              <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                {r.ref}
              </span>
            )}

            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
              r.ok
                ? 'bg-[#D4F0E2] text-[#145C38]'
                : 'bg-red-50 text-[#E8314A]'
            }`}>
              {r.ok ? 'Créé' : 'Échec'}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {nbErr > 0 && (
          <Button
            variant="outline"
            className="border-[#E8314A] text-[#E8314A] hover:bg-red-50"
            onClick={handleRetry}
          >
            Réessayer les {nbErr} échec{nbErr > 1 ? 's' : ''}
          </Button>
        )}
        <Button
          onClick={onNavigate}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          Voir les produits
        </Button>
      </div>
    </div>
  )
}