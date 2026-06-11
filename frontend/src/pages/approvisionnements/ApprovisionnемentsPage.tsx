// src/pages/approvisionnements/ApprovisionnемentsPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getApprovisionnements, type Approvisionnement } from '@/api/approvisionnements'
import { formatDate, formatMontant } from '@/utils/format'

export default function ApprovisionnementsPage() {
  const { boutiqueId } = useParams()
  const navigate        = useNavigate()
  const id              = Number(boutiqueId)

  const [appros,   setAppros]   = useState<Approvisionnement[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getApprovisionnements(id)
      .then(res => {
        const data = res.data?.data ?? res.data
        setAppros(Array.isArray(data) ? data : [])
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Approvisionnements</h1>
          <p className="text-gray-500 text-sm mt-1">{appros.length} entrée{appros.length > 1 ? 's' : ''} en stock</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/boutiques/${id}/approvisionnements/reception`)}
            className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            <Plus size={18} className="mr-2" />
            Réception de marchandises
          </Button>
          <Button
            onClick={() => navigate(`/boutiques/${id}/approvisionnements/nouveau`)}
            variant="outline"
            className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2]"
          >
            <Plus size={18} className="mr-2" />
            Réapprovisionnement
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : appros.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun approvisionnement</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Référence</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Fournisseur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Produits</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Enregistré par</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appros.map(a => {
                  const total = a.lignes.reduce((s, l) => s + Number(l.prix_achat) * l.quantite, 0)
                  return (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{a.reference}</td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">
                        {a.fournisseur.nom}
                        {a.fournisseur.provenance && (
                          <span className="text-xs text-gray-400 ml-1">· {a.fournisseur.provenance}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {a.lignes.length} article{a.lignes.length > 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-[#1A7A4A]">
                        {formatMontant(total)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {a.user.prenom} {a.user.nom}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/boutiques/${id}/approvisionnements/${a.id}`)}
                          className="text-gray-400 hover:text-[#1A7A4A] transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}