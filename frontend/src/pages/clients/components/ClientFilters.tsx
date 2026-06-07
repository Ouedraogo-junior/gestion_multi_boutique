import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export interface ClientFilterValues {
  statut: 'tous' | 'avec_dette' | 'en_regle'
  dateDebut: string
  dateFin: string
}

interface Props {
  values: ClientFilterValues
  onChange: (values: ClientFilterValues) => void
  onReset: () => void
}

export const defaultFilters: ClientFilterValues = {
  statut: 'tous',
  dateDebut: '',
  dateFin: '',
}

export default function ClientFilters({ values, onChange, onReset }: Props) {
  const hasActive =
    values.statut !== 'tous' || values.dateDebut !== '' || values.dateFin !== ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-[180px_160px_160px_1fr] gap-4 items-end">

        {/* Statut */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Statut</span>
          <Select
            value={values.statut}
            onValueChange={v => onChange({ ...values, statut: v as ClientFilterValues['statut'] })}
          >
            <SelectTrigger className="h-9 text-sm border-gray-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="avec_dette">Avec dette</SelectItem>
              <SelectItem value="en_regle">En règle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date début */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Dernier paiement — du</span>
          <Input
            type="date"
            value={values.dateDebut}
            onChange={e => onChange({ ...values, dateDebut: e.target.value })}
          />
        </div>

        {/* Date fin */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">au</span>
          <Input
            type="date"
            value={values.dateFin}
            onChange={e => onChange({ ...values, dateFin: e.target.value })}
          />
        </div>

        {/* Reset */}
        <div className="flex items-end">
          {hasActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-9 text-gray-400 hover:text-[#E8314A] gap-1"
            >
              <X size={14} />
              Réinitialiser
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}