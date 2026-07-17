import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store } from 'lucide-react'
import { createClient, updateClient } from '@/api/clients'
import type { Client } from '@/api/clients'
import { getBoutiquesDisponibles } from '@/api/transferts-boutiques'
import type { BoutiqueOption } from '@/api/transferts-boutiques'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  open: boolean
  onClose: () => void
  onSaved: (client: Client) => void
  initial?: Client | null
}

const formVide = {
  nom: '', prenom: '', telephone: '', adresse: '', notes: '',
  est_boutique: false, represente_boutique_id: '',
}

export default function ClientForm({ boutiqueId, open, onClose, onSaved, initial }: Props) {
  const [form, setForm]         = useState(formVide)
  const [boutiques, setBoutiques] = useState<BoutiqueOption[]>([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        nom:                     initial.nom                     ?? '',
        prenom:                  initial.prenom                  ?? '',
        telephone:               initial.telephone               ?? '',
        adresse:                 initial.adresse                 ?? '',
        notes:                   initial.notes                   ?? '',
        est_boutique:            initial.est_boutique             ?? false,
        represente_boutique_id:  initial.represente_boutique_id ? String(initial.represente_boutique_id) : '',
      })
    } else {
      setForm(formVide)
    }
  }, [initial, open])

  useEffect(() => {
    if (!open) return
    getBoutiquesDisponibles(boutiqueId).then(res => setBoutiques(res.data))
  }, [open, boutiqueId])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom.trim()) { toast.error('Le nom est requis'); return }
    if (form.est_boutique && !form.represente_boutique_id) {
      toast.error('Sélectionnez la boutique représentée')
      return
    }

    setLoading(true)
    try {
      const payload = {
        nom:       form.nom,
        prenom:    form.prenom,
        telephone: form.telephone,
        adresse:   form.adresse,
        notes:     form.notes,
        est_boutique: form.est_boutique,
        represente_boutique_id: form.est_boutique && form.represente_boutique_id
          ? Number(form.represente_boutique_id)
          : null,
      }

      const res = initial
        ? await updateClient(boutiqueId, initial.id, payload)
        : await createClient(boutiqueId, payload)
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

          {/* Toggle "est une boutique" */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, est_boutique: !f.est_boutique }))}
                className={`mt-0.5 w-9 h-5 rounded-full shrink-0 transition-colors relative ${
                  form.est_boutique ? 'bg-[#1A7A4A]' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.est_boutique ? 'translate-x-4' : ''
                }`} />
              </button>
              <div>
                <Label className="flex items-center gap-1.5 cursor-pointer" onClick={() => setForm(f => ({ ...f, est_boutique: !f.est_boutique }))}>
                  <Store size={14} className="text-gray-500" />
                  Ce client est en réalité une boutique du réseau
                </Label>
                <p className="text-xs text-gray-400 mt-1">
                  Ses avances ne seront pas comptées dans les statistiques d'avances de la boutique (dashboard, totaux).
                </p>
              </div>
            </div>

            {form.est_boutique && (
              <div className="space-y-1 pl-12">
                <Label className="text-xs text-gray-500">Cette boutique correspond à *</Label>
                <Select value={form.represente_boutique_id} onValueChange={v => set('represente_boutique_id', v)}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Sélectionner une boutique du réseau" />
                  </SelectTrigger>
                  <SelectContent>
                    {boutiques.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {boutiques.length === 0 && (
                  <p className="text-xs text-amber-600">Aucune autre boutique active trouvée.</p>
                )}
                <p className="text-xs text-gray-400">
                  Permet d'utiliser l'avance de ce client pour régler directement un transfert vers cette boutique.
                </p>
              </div>
            )}
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