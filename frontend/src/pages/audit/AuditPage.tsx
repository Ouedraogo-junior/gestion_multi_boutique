import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { getAuditBoutique, getAuditGlobal, type AuditLog } from '@/api/audit'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import AuditFilters, { defaultFilters, type AuditFilterValues } from './components/AuditFilters'

const MODULE_COLORS: Record<string, string> = {
  auth:          'bg-blue-50 text-blue-700',
  ventes:        'bg-green-50 text-green-700',
  produits:      'bg-purple-50 text-purple-700',
  stock:         'bg-orange-50 text-orange-700',
  clients:       'bg-cyan-50 text-cyan-700',
  depenses:      'bg-red-50 text-red-700',
  retours:       'bg-yellow-50 text-yellow-700',
  utilisateurs:  'bg-indigo-50 text-indigo-700',
  boutiques:     'bg-teal-50 text-teal-700',
  parametres:    'bg-gray-100 text-gray-600',
  general:       'bg-gray-100 text-gray-500',
}

export default function AuditPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [filters, setFilters] = useState<AuditFilterValues>(defaultFilters)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page: p, per_page: 25 }
      if (filters.module)      params.module      = filters.module
      if (filters.user_pseudo) params.user_pseudo = filters.user_pseudo
      if (filters.debut)       params.debut       = filters.debut
      if (filters.fin)         params.fin         = filters.fin

      const res = isSuperAdmin
        ? await getAuditGlobal(params)
        : await getAuditBoutique(id, params)

      const data = res.data?.data ?? res.data
      setLogs(Array.isArray(data) ? data : [])
      setTotal(res.data?.total ?? 0)
      setLastPage(res.data?.last_page ?? 1)
      setPage(p)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [id, filters])

  const handleFiltersChange = (v: AuditFilterValues) => {
    setFilters(v)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Journal d'audit</h1>
          <p className="text-gray-500 text-sm mt-1">{total} entrée{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shield size={16} />
          Journal non modifiable
        </div>
      </div>

      {/* Filtres */}
      <AuditFilters
        values={filters}
        onChange={handleFiltersChange}
        onReset={() => setFilters(defaultFilters)}
      />

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune entrée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Module</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Action</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Détails</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-[#1C1C1C]">{log.user_nom}</p>
                      <p className="text-xs font-mono text-gray-400">{log.user_pseudo}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${MODULE_COLORS[log.module] ?? 'bg-gray-100 text-gray-500'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400 max-w-xs truncate">
                      {log.details
                        ? <span title={JSON.stringify(log.details, null, 2)} className="cursor-help">
                            {JSON.stringify(log.details).slice(0, 60)}{JSON.stringify(log.details).length > 60 ? '…' : ''}
                          </span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-400">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">Page {page} / {lastPage}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-[#F4F6F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                disabled={page >= lastPage}
                onClick={() => load(page + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-[#F4F6F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}