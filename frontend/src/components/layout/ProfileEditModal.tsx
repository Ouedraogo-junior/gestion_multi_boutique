import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import api from '@/api/axios'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

interface ProfileEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ nom: '', prenom: '', pseudo: '' })
  const [loading, setLoading] = useState(false)
  const [confirmPseudo, setConfirmPseudo] = useState(false)

  // Réinitialise le formulaire avec les valeurs actuelles à chaque ouverture
  useEffect(() => {
    if (open && user) {
      setForm({ nom: user.nom, prenom: user.prenom, pseudo: user.pseudo })
    }
  }, [open, user])

  const pseudoChange = user ? form.pseudo !== user.pseudo : false

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser({ ...user!, ...data })
      toast.success('Profil mis à jour')
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.errors?.pseudo?.[0]
        ?? 'Erreur lors de la mise à jour du profil'
      toast.error(msg)
    } finally {
      setLoading(false)
      setConfirmPseudo(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pseudoChange) {
      setConfirmPseudo(true)
      return
    }
    submit()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound size={18} className="text-[#29ABE2]" />
              Modifier mes informations
            </DialogTitle>
            <DialogDescription>
              Ces informations sont visibles par les administrateurs de votre boutique.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pseudo</Label>
              <Input value={form.pseudo}
                onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))} required />
              <p className="text-xs text-gray-400">Le pseudo sert à la connexion.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="border-gray-200"
                onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dédiée au changement de pseudo */}
      <AlertDialog open={confirmPseudo} onOpenChange={setConfirmPseudo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de pseudo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous utilisez actuellement <strong>{user?.pseudo}</strong> pour vous connecter.
              Après cette modification, utilisez <strong>{form.pseudo}</strong> lors de votre prochaine connexion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={submit} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}