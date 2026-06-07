import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword, type Utilisateur } from '@/api/utilisateurs'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  user: Utilisateur | null
  onClose: () => void
}

interface FormValues {
  password: string
  password_confirmation: string
}

export default function ResetPasswordDialog({ boutiqueId, user, onClose }: Props) {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>()

  const onSubmit = async (data: FormValues) => {
    if (!user) return
    try {
      await resetPassword(boutiqueId, user.id, data)
      toast.success('Mot de passe réinitialisé')
      reset()
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erreur')
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        </DialogHeader>
        {user && (
          <p className="text-sm text-gray-500 -mt-2">
            {user.prenom} {user.nom} — <span className="font-mono">{user.pseudo}</span>
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" {...register('password', { required: true, minLength: 6 })} placeholder="••••••" />
            {errors.password && <p className="text-xs text-red-500">Minimum 6 caractères</p>}
          </div>
          <div className="space-y-1">
            <Label>Confirmer</Label>
            <Input
              type="password"
              {...register('password_confirmation', {
                required: true,
                validate: v => v === watch('password') || 'Les mots de passe ne correspondent pas'
              })}
              placeholder="••••••"
            />
            {errors.password_confirmation && (
              <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
              {isSubmitting ? 'Enregistrement...' : 'Réinitialiser'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}