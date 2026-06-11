// src/pages/boutiques/components/BoutiqueForm.tsx
import { useState } from 'react'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createBoutique, updateBoutique } from '@/api/boutiques'

interface Props {
  boutique?: Boutique
  onSuccess: () => void
  onCancel: () => void
}

export default function BoutiqueForm({ boutique, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    nom:            boutique?.nom            ?? '',
    adresse:        boutique?.adresse        ?? '',
    telephone:      boutique?.telephone      ?? '',
    slogan:         boutique?.slogan         ?? '',
    ncc:            boutique?.ncc            ?? '',
    mention_legale: boutique?.mention_legale ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (boutique) {
        await updateBoutique(boutique.id, form)
      } else {
        await createBoutique(form)
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input id="nom" value={form.nom} onChange={e => set('nom', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input id="telephone" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adresse">Adresse</Label>
        <Input id="adresse" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slogan">Slogan</Label>
          <Input id="slogan" value={form.slogan} onChange={e => set('slogan', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ncc">NCC (Numéro de compte contribuable)</Label>
          <Input
            id="ncc"
            value={form.ncc}
            onChange={e => set('ncc', e.target.value)}
            placeholder="Ex: 1329951D"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mention_legale">Mention légale</Label>
        <Textarea
          id="mention_legale"
          value={form.mention_legale}
          onChange={e => set('mention_legale', e.target.value)}
          placeholder="Ex: Retours acceptés sous 7 jours sur présentation du reçu..."
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-[#E8314A] bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          {loading ? 'Enregistrement...' : boutique ? 'Modifier' : 'Créer'}
        </Button>
      </div>

    </form>
  )
}