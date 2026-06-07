import { formatMontant } from '@/utils/format'

type DetteClient = {
  client_id: number
  nom: string
  prenom: string
  telephone: string
  total_credit: number
  total_paye: number
  solde_dette: number
}

type DettesData = {
  boutique_id: number
  total_dettes: number
  clients: DetteClient[]
}

export default function TabDettes({ data }: { data: DettesData }) {
  const clients = data.clients ?? []
  const total   = Number(data.total_dettes ?? 0)

  return (
    <div className="space-y-6">
      <div className="bg-red-50 rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Total créances clients</p>
        <p className="text-3xl text-[#E8314A]">{formatMontant(total)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {clients.length} client{clients.length > 1 ? 's' : ''} avec dette
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune dette client</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total crédit</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Total payé</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-500 font-medium">Solde dû</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.client_id} className="border-b border-gray-100 hover:bg-[#F4F6F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1C1C1C]">
                      {[c.prenom, c.nom].filter(Boolean).join(' ')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{c.telephone ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{formatMontant(Number(c.total_credit))}</td>
                    <td className="py-3 px-4 text-sm text-[#1A7A4A]">{formatMontant(Number(c.total_paye))}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#E8314A]">{formatMontant(Number(c.solde_dette))}</td>
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