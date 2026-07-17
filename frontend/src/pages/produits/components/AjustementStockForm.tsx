import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ajusterStock } from '@/api/produits'
import type { Variante } from '@/api/produits'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  variantes: Variante[]
  onSuccess: () => void
}

export default function AjustementStockForm({ boutiqueId, variantes, onSuccess }: Props) {
  const [varianteId, setVarianteId] = useState(variantes.length === 1 ? String(variantes[0].id) : '')
  const [nouveauStock, setNouveauStock] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const varianteSelectionnee = variantes.find(v => v.id === Number(varianteId))

  const handleSubmit = async () => {
    if (!varianteId) { toast.error('Sélectionnez une variante'); return }
    if (nouveauStock === '' || Number(nouveauStock) < 0) { toast.error('Nouveau stock invalide'); return }
    if (!note.trim() || note.trim().length < 3) { toast.error('Une justification est requise'); return }

    setLoading(true)
    try {
      const res = await ajusterStock(boutiqueId, {
        variante_id: Number(varianteId),
        nouveau_stock: Number(nouveauStock),
        note: note.trim(),
      })

      const sens = res.data.ecart > 0 ? 'augmenté' : 'diminué'
      toast.success(`Stock ${sens} de ${Math.abs(res.data.ecart)} (nouveau total : ${res.data.stock_actuel})`)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erreur lors de la correction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {variantes.length > 1 && (
        <div className="space-y-1">
          <Label>Variante *</Label>
          <Select value={varianteId} onValueChange={setVarianteId}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Sélectionner une variante" />
            </SelectTrigger>
            <SelectContent>
              {variantes.map(v => {
                const label = v.attributs && Object.keys(v.attributs).length > 0
                  ? Object.entries(v.attributs).map(([k, val]) => `${k}: ${val}`).join(' / ')
                  : 'Défaut'
                return (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {label} — stock actuel : {v.stock_actuel}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {varianteSelectionnee && (
        <p className="text-sm text-gray-500">
          Stock actuel : <strong className="text-gray-900">{varianteSelectionnee.stock_actuel}</strong>
        </p>
      )}

      <div className="space-y-1">
        <Label>Nouveau stock exact *</Label>
        <Input
          type="number"
          min={0}
          value={nouveauStock}
          onChange={e => setNouveauStock(e.target.value)}
          placeholder="Quantité réellement en rayon/entrepôt"
        />
      </div>

      <div className="space-y-1">
        <Label>Motif de la correction *</Label>
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ex : comptage physique, erreur de saisie, casse..."
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
      >
        {loading ? 'Enregistrement...' : 'Corriger le stock'}
      </Button>
    </div>
  )
}