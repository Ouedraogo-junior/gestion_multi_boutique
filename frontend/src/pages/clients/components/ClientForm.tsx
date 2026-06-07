import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient, updateClient } from '@/api/clients'
import type { Client } from '@/api/clients'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  open: boolean
  onClose: () => void
  onSaved: (client: Client) => void
  initial?: Client | null
}

const formVide = { nom: '', prenom: '', telephone: '', adresse: '', notes: '' }

export default function ClientForm({ boutiqueId, open, onClose, onSaved, initial }: Props) {
  const [form, setForm]     = useState(formVide)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        nom:       initial.nom       ?? '',
        prenom:    initial.prenom    ?? '',
        telephone: initial.telephone ?? '',
        adresse:   initial.adresse   ?? '',
        notes:     initial.notes     ?? '',
      })
    } else {
      setForm(formVide)
    }
  }, [initial, open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom.trim()) { toast.error('Le nom est requis'); return }
    setLoading(true)
    try {
      const res = initial
        ? await updateClient(boutiqueId, initial.id, form)
        : await createClient(boutiqueId, form)
      toast.success(initial ? 'Client modifié' : 'Client ajouté')
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initial ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.nom} onChange={e => set('nom', e.target.value)} className="border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input value={form.prenom} onChange={e => set('prenom', e.target.value)} className="border-gray-200" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={form.telephone} onChange={e => set('telephone', e.target.value)} className="border-gray-200" />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} className="border-gray-200" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="border-gray-200" />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1A7A4A] hover:bg-[#145C38] text-white"
          >
            {loading ? 'Enregistrement...' : initial ? 'Modifier' : 'Ajouter le client'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}