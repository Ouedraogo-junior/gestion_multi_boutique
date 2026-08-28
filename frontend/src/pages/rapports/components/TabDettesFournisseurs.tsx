import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatMontant, formatDate } from '@/utils/format'

type DetteFournisseur = {
  fournisseur_id: number
  nom: string
  telephone: string | null
  provenance: string | null
  total_du: number
  total_paye: number
  solde_dette: number
}

type PaiementPeriode = {
  id: number
  fournisseur_id: number
  nom: string
  montant: number
  date: string
  numero_approvisionnement: string | null
}

type DettesFournisseursData = {
  boutique_id: number
  total_dettes: number
  fournisseurs: DetteFournisseur[]
  periode?: { debut: string; fin: string }
  total_paiements_periode?: number
  paiements_periode?: PaiementPeriode[]
}

export default function TabDettesFournisseurs({ data }: { data: DettesFournisseursData }) {
  const navigate = useNavigate()
  const fournisseurs = data.fournisseurs ?? []
  const total         = Number(data.total_dettes ?? 0)
  const paiementsPeriode      = data.paiements_periode ?? []
  const totalPaiementsPeriode = Number(data.total_paiements_periode ?? 0)

  const [search, setSearch] = useState('')

  const fournisseursFiltres = fournisseurs.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.nom?.toLowerCase().includes(q) ||
      f.telephone?.toLowerCase().includes(q) ||
      f.provenance?.toLowerCase().includes(q)
    )
  })

  const allerVersDettesFournisseurs = () => {
    navigate(`/boutiques/${data.boutique_id}/dettes-fournisseurs`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Total dettes fournisseurs</p>
        <p className="text-3xl text-[#E8314A]">{formatMontant(total)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''} avec dette — solde actuel, indépendant de la période choisie
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un fournisseur..."
            className="pl-9 border-gray-200"
          />
        </div>
        <button
          onClick={allerVersDettesFournisseurs}
          className="flex items-center gap-2 text-sm text-[#1A7A4A] hover:underline whitespace-nowrap"
        >
          Gérer les paiements <ExternalLink size={14} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {fournisseurs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune dette fournisseur</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Fournisseur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total dû</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total payé</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Solde dû</th>
                </tr>
              </thead>
              <tbody>
                {fournisseursFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Aucun fournisseur trouvé
                    </td>
                  </tr>
                ) : (
                  fournisseursFiltres.map(f => (
                    <tr key={f.fournisseur_id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">
                        {f.nom}
                        {f.provenance && <span className="text-gray-400"> · {f.provenance}</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{f.telephone ?? '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(Number(f.total_du))}</td>
                      <td className="py-3 px-4 text-sm text-[#1A7A4A]">{formatMontant(Number(f.total_paye))}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-[#E8314A]">{formatMontant(Number(f.solde_dette))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique des paiements effectués sur la période */}
      <div className="bg-[#D4F0E2] rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Paiements effectués sur la période</p>
        <p className="text-3xl text-[#1A7A4A]">{formatMontant(totalPaiementsPeriode)}</p>
        {data.periode && (
          <p className="text-xs text-gray-400 mt-1">
            Du {formatDate(data.periode.debut)} au {formatDate(data.periode.fin)}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Historique des paiements</h3>
        </div>
        {paiementsPeriode.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun paiement effectué sur cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Fournisseur</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Approvisionnement</th>
                  <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {paiementsPeriode.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-2.5 px-4 text-sm text-gray-600">{formatDate(p.date)}</td>
                    <td className="py-2.5 px-4 text-sm font-medium text-[#1C1C1C]">{p.nom}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-500">
                      <span className="font-mono text-xs">{p.numero_approvisionnement ?? '—'}</span>
                    </td>
                    <td className="py-2.5 px-4 text-sm font-medium text-[#1A7A4A] text-right">
                      {formatMontant(Number(p.montant))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}