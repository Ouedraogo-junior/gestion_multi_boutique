import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getReferentiels, type Referentiel } from '@/api/referentiels'
import { createDepense, updateDepense, type Depense, type DepensePayload } from '@/api/depenses'
import { toast } from 'sonner'

type Props = {
  boutiqueId: number
  open: boolean
  onClose: () => void
  onSaved: (d: Depense) => void
  initial?: Depense | null
}

export default function DepenseForm({ boutiqueId, open, onClose, onSaved, initial }: Props) {
  const [categories, setCategories] = useState<Referentiel[]>([])
  const [loading, setLoading]       = useState(false)

  const [montant,     setMontant]     = useState('')
  const [description, setDescription] = useState('')
  const [date,        setDate]        = useState('')
  const [categorieId, setCategorieId] = useState<string>('')

  // Charger les catégories depuis le référentiel
  useEffect(() => {
    getReferentiels(boutiqueId, 'categorie_depense')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data as any)?.data ?? []
        setCategories(data)
      })
      .catch(() => {})
  }, [boutiqueId])

  // Pré-remplir si édition
  useEffect(() => {
    if (initial) {
      setMontant(String(initial.montant))
      setDescription(initial.description ?? '')
      setDate(initial.date.substring(0, 10))
      setCategorieId(initial.categorie_id ? String(initial.categorie_id) : '')
    } else {
      setMontant('')
      setDescription('')
      setDate(new Date().toISOString().substring(0, 10))
      setCategorieId('')
    }
  }, [initial, open])

  const handleSubmit = async () => {
    if (!montant || !date) {
      toast.error('Montant et date sont obligatoires')
      return
    }
    setLoading(true)
    try {
      const payload: DepensePayload = {
        montant:      Number(montant),
        description:  description || undefined,
        date,
        categorie_id: categorieId ? Number(categorieId) : null,
      }
      let res
      if (initial) {
        res = await updateDepense(boutiqueId, initial.id, payload)
      } else {
        res = await createDepense(boutiqueId, payload)
      }
      toast.success(initial ? 'Dépense modifiée' : 'Dépense enregistrée')
      onSaved(res.data)
      onClose()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initial ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Loyer du magasin"
              className="border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categorieId} onValueChange={setCategorieId}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="__none__" disabled>Aucune catégorie configurée</SelectItem>
                ) : (
                  categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.libelle}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <Input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="0"
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border-gray-200"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : initial ? 'Modifier' : 'Enregistrer la dépense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}