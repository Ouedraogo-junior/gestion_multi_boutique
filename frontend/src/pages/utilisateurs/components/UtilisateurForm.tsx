import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUtilisateur, updateUtilisateur, type Utilisateur } from '@/api/utilisateurs'
import { toast } from 'sonner'
import { getBoutiques } from '@/api/boutiques'
import type { Boutique } from '@/contexts/BoutiqueContext'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'

interface Props {
  boutiqueId: number
  open: boolean
  onClose: () => void
  onSaved: (u: Utilisateur) => void
  initial: Utilisateur | null
}

interface FormValues {
  nom: string
  prenom: string
  pseudo: string
  role: 'admin_boutique' | 'vendeur'
  password: string
  boutique_id: number | null
}

export default function UtilisateurForm({ boutiqueId, open, onClose, onSaved, initial }: Props) {
  const isEdit = !!initial
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>()
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN
  const [boutiques, setBoutiques] = useState<Boutique[]>([])

  useEffect(() => {
    if (!isSuperAdmin) return
    getBoutiques().then(res => {
      const data = res.data?.data ?? res.data
      setBoutiques(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [isSuperAdmin])

  useEffect(() => {
    if (open) {
      reset({
        nom:     initial?.nom     ?? '',
        prenom:  initial?.prenom  ?? '',
        pseudo:  initial?.pseudo  ?? '',
        role:    initial?.role    ?? 'vendeur',
        password: '',
        // Pour les super admins, on associe la boutique à l'utilisateur. Pour les admins boutique, c'est la boutique active qui est utilisée.
        boutique_id: initial?.boutique_id ?? null,
      })
    }
  }, [open, initial])

  const onSubmit = async (data: FormValues) => {
    try {
      const targetBoutiqueId = isSuperAdmin ? data.boutique_id : boutiqueId

      if (isSuperAdmin && !targetBoutiqueId) {
        toast.error('Veuillez sélectionner une boutique')
        return
      }

      const payload: Record<string, unknown> = {
        nom: data.nom, prenom: data.prenom, pseudo: data.pseudo, role: data.role,
      }
      if (!isEdit) payload.password = data.password

      const res = isEdit
        ? await updateUtilisateur(Number(targetBoutiqueId), initial!.id, payload)
        : await createUtilisateur(Number(targetBoutiqueId), payload)

      toast.success(isEdit ? 'Utilisateur modifié' : 'Utilisateur créé')
      onSaved(res.data)
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Prénom</Label>
              <Input {...register('prenom', { required: true })} placeholder="Amadou" />
              {errors.prenom && <p className="text-xs text-red-500">Requis</p>}
            </div>
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input {...register('nom', { required: true })} placeholder="Diallo" />
              {errors.nom && <p className="text-xs text-red-500">Requis</p>}
            </div>
          </div>

          {isSuperAdmin && !isEdit && (
            <div className="space-y-1">
              <Label>Boutique</Label>
              <Select
                value={watch('boutique_id')?.toString() ?? ''}
                onValueChange={v => setValue('boutique_id', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une boutique" />
                </SelectTrigger>
                <SelectContent>
                  {boutiques.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Pseudo</Label>
            <Input {...register('pseudo', { required: true })} placeholder="amadou.diallo" />
            {errors.pseudo && <p className="text-xs text-red-500">Requis</p>}
          </div>

          <div className="space-y-1">
            <Label>Rôle</Label>
            <Select value={watch('role')} onValueChange={v => setValue('role', v as 'admin_boutique' | 'vendeur')}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendeur">Vendeur</SelectItem>
                <SelectItem value="admin_boutique">Admin Boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <div className="space-y-1">
              <Label>Mot de passe</Label>
              <Input type="password" {...register('password', { required: !isEdit, minLength: 6 })} placeholder="••••••" />
              {errors.password && <p className="text-xs text-red-500">Minimum 6 caractères</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
              {isSubmitting ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}