import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import api from '@/api/axios'
import { toast } from 'sonner'

export default function SectionPassword() {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await api.put('/auth/password', {
        current_password: form.current,
        new_password: form.new,
        new_password_confirmation: form.confirm,
      })
      toast.success('Mot de passe modifié')
      setForm({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data?.errors?.current_password?.[0]
        ?? 'Erreur lors du changement de mot de passe'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lock size={20} className="text-[#29ABE2]" />
        <h2 className="text-lg text-[#1C1C1C]">Changer le mot de passe</h2>
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Mot de passe actuel</Label>
          <Input type="password" value={form.current}
            onChange={e => setForm(f => ({ ...f, current: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nouveau mot de passe</Label>
            <Input type="password" value={form.new}
              onChange={e => setForm(f => ({ ...f, new: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Confirmer</Label>
            <Input type="password" value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          {loading ? 'Enregistrement...' : 'Modifier le mot de passe'}
        </Button>
      </form>
    </div>
  )
}