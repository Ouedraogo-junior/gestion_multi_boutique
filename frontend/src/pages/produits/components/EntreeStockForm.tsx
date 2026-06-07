import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { entreeStock } from '@/api/produits'
import type { Variante } from '@/api/produits'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  variantes: Variante[]
  onSuccess: () => void
}

export default function EntreeStockForm({ boutiqueId, variantes, onSuccess }: Props) {
  const [varianteId, setVarianteId] = useState<number>(variantes[0]?.id ?? 0)
  const [quantite, setQuantite]     = useState('')
  const [note, setNote]             = useState('')
  const [loading, setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await entreeStock(boutiqueId, {
        variante_id: varianteId,
        quantite: Number(quantite),
        note,
      })
      toast.success('Stock mis à jour')
      setQuantite('')
      setNote('')
      onSuccess()
    } catch {
      toast.error('Erreur lors de la mise à jour du stock')
    } finally {
      setLoading(false)
    }
  }

  const getLabel = (v: Variante) => {
    if (!v.attributs || Object.keys(v.attributs).length === 0) return 'Stock principal'
    return Object.entries(v.attributs).map(([k, val]) => `${k}: ${val}`).join(' / ')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {variantes.length > 1 && (
        <div className="space-y-2">
          <Label>Variante</Label>
          <select
            value={varianteId}
            onChange={e => setVarianteId(Number(e.target.value))}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {variantes.map(v => (
              <option key={v.id} value={v.id}>{getLabel(v)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Quantité à ajouter *</Label>
        <Input
          type="number"
          min={1}
          value={quantite}
          onChange={e => setQuantite(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Note</Label>
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ex: Réception commande juillet"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          {loading ? 'Enregistrement...' : 'Ajouter au stock'}
        </Button>
      </div>
    </form>
  )
}