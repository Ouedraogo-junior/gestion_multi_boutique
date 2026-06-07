import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface AuditFilterValues {
  module: string
  user_pseudo: string
  debut: string
  fin: string
}

export const defaultFilters: AuditFilterValues = {
  module: '',
  user_pseudo: '',
  debut: '',
  fin: '',
}

const MODULES = [
  'auth', 'boutiques', 'produits', 'stock',
  'ventes', 'clients', 'depenses', 'retours', 'utilisateurs', 'parametres',
]

interface Props {
  values: AuditFilterValues
  onChange: (v: AuditFilterValues) => void
  onReset: () => void
}

export default function AuditFilters({ values, onChange, onReset }: Props) {
  const set = (key: keyof AuditFilterValues, val: string) =>
    onChange({ ...values, [key]: val })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-sm text-gray-500">Module</Label>
          <Select value={values.module || '_all'} onValueChange={v => set('module', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-40 border-gray-200">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Tous</SelectItem>
              {MODULES.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-gray-500">Utilisateur</Label>
          <Input
            value={values.user_pseudo}
            onChange={e => set('user_pseudo', e.target.value)}
            placeholder="pseudo..."
            className="border-gray-200 w-36"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-gray-500">Du</Label>
          <Input
            type="date"
            value={values.debut}
            onChange={e => set('debut', e.target.value)}
            className="border-gray-200 w-40"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm text-gray-500">Au</Label>
          <Input
            type="date"
            value={values.fin}
            onChange={e => set('fin', e.target.value)}
            className="border-gray-200 w-40"
          />
        </div>

        <Button variant="outline" onClick={onReset} className="border-gray-200 text-gray-500">
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}