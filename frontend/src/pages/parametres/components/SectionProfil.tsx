import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import api from '@/api/axios'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function SectionProfil() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    pseudo: user?.pseudo ?? '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser({ ...user!, ...data })
      toast.success('Profil mis à jour')
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.errors?.pseudo?.[0]
        ?? 'Erreur lors de la mise à jour du profil'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <UserRound size={20} className="text-[#29ABE2]" />
        <h2 className="text-lg text-[#1C1C1C]">Mes informations</h2>
      </div>
      <Separator />
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
          <p className="text-xs text-gray-400">
            Le pseudo sert à la connexion. Si vous le modifiez, utilisez le nouveau pseudo lors de votre prochaine connexion.
          </p>
        </div>
        <Button type="submit" disabled={loading} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </form>
    </div>
  )
}