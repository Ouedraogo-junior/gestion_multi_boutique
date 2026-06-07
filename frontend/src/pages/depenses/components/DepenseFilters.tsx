import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { Referentiel } from '@/api/referentiels'

export type DepenseFilterValues = {
  categorie_id: string
  debut: string
  fin: string
}

export const defaultFilters: DepenseFilterValues = {
  categorie_id: '',
  debut: '',
  fin: '',
}

type Props = {
  values: DepenseFilterValues
  categories: Referentiel[]
  onChange: (v: DepenseFilterValues) => void
  onReset: () => void
}

export default function DepenseFilters({ values, categories, onChange, onReset }: Props) {
  const hasFilter = values.categorie_id || values.debut || values.fin

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-sm text-gray-500">Catégorie</Label>
          <Select
            value={values.categorie_id || 'toutes'}
            onValueChange={v => onChange({ ...values, categorie_id: v === 'toutes' ? '' : v })}
          >
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les catégories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.libelle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-sm text-gray-500">Du</Label>
          <Input
            type="date"
            value={values.debut}
            onChange={e => onChange({ ...values, debut: e.target.value })}
            className="border-gray-200"
          />
        </div>

        <div className="flex-1 space-y-1">
          <Label className="text-sm text-gray-500">Au</Label>
          <Input
            type="date"
            value={values.fin}
            onChange={e => onChange({ ...values, fin: e.target.value })}
            className="border-gray-200"
          />
        </div>

        {hasFilter && (
          <Button
            variant="outline"
            onClick={onReset}
            className="border-gray-200 text-gray-500 hover:text-gray-700"
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}