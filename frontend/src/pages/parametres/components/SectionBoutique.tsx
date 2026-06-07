import { useEffect, useRef, useState } from 'react'
import { Building2, Save, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { getBoutique, updateBoutique } from '@/api/boutiques'
import { toast } from 'sonner'

interface Props { boutiqueId: number }

export default function SectionBoutique({ boutiqueId }: Props) {
  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '', slogan: '', mention_legale: ''
  })
  const [logoActuel, setLogoActuel]   = useState<string | null>(null)
  const [logoFichier, setLogoFichier] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const inputLogoRef                  = useRef<HTMLInputElement>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  useEffect(() => {
    getBoutique(boutiqueId).then(res => {
      const b = res.data
      setForm({
        nom:            b.nom            ?? '',
        adresse:        b.adresse        ?? '',
        telephone:      b.telephone      ?? '',
        slogan:         b.slogan         ?? '',
        mention_legale: b.mention_legale ?? '',
      })
      setLogoActuel(b.logo_url ?? null)
    })
  }, [boutiqueId])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFichier(file)
    setLogoPreview(URL.createObjectURL(file))
    setRemoveLogo(false)  // ← nouveau logo annule la suppression
  }

  const handleSupprimerLogo = () => {
    setLogoFichier(null)
    setLogoPreview(null)
    setRemoveLogo(true)  // ← signale la suppression
    if (inputLogoRef.current) inputLogoRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      formData.append('_method', 'PUT')

      if (logoFichier) {
        formData.append('logo', logoFichier)
      } else if (removeLogo) {
        formData.append('remove_logo', 'true')
      }

      const res = await updateBoutique(boutiqueId, formData)
      setLogoActuel(res.data.logo_url ?? null)
      setLogoFichier(null)
      setLogoPreview(null)
      setRemoveLogo(false)
      toast.success('Informations enregistrées')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const logoAffiché = logoPreview ?? logoActuel

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={20} className="text-[#1A7A4A]" />
        <h2 className="text-lg text-[#1C1C1C]">Informations de la boutique</h2>
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            {logoAffiché ? (
              <div className="relative">
                <img
                  src={logoAffiché}
                  alt="Logo boutique"
                  className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handleSupprimerLogo}
                  className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-[#E8314A]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-300">
                <Upload size={24} />
              </div>
            )}
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-200"
                onClick={() => inputLogoRef.current?.click()}
              >
                <Upload size={14} className="mr-2" />
                {logoAffiché ? 'Changer le logo' : 'Choisir un logo'}
              </Button>
              <p className="text-xs text-gray-400">PNG, JPG — max 2 Mo</p>
            </div>
          </div>
          <input
            ref={inputLogoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={form.telephone} onChange={e => set('telephone', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slogan</Label>
            <Input value={form.slogan} onChange={e => set('slogan', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mention légale</Label>
          <Textarea value={form.mention_legale} onChange={e => set('mention_legale', e.target.value)} rows={3} />
        </div>
        <Button type="submit" disabled={loading} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          <Save size={16} className="mr-2" />
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  )
}