import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
//import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBoutique } from '../../api/boutiques'
import { useBoutique } from '../../hooks/useBoutique'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../utils/constants'

export default function Login() {
  const { login }   = useAuth()
  const { setBoutiqueActive } = useBoutique()
  const navigate    = useNavigate()
  const [pseudo, setPseudo]       = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(pseudo, password)

      // Peupler boutiqueActive pour Admin et Vendeur
      if (user.role !== ROLES.SUPER_ADMIN && user.boutique_id) {
        const res = await getBoutique(user.boutique_id)
        setBoutiqueActive(res.data)
      }

      if (user.role === ROLES.SUPER_ADMIN) {
        navigate('/dashboard')
      } else {
        const base = `/boutiques/${user.boutique_id}`
        navigate(`${base}/dashboard`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Identifiants incorrects'
      const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(axiosMessage ?? message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo_3.png"
              alt="Hamed Telecom"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
            <div
              className="w-32 h-32 rounded-2xl bg-[#1A7A4A] items-center justify-center hidden"
            >
              <span className="text-white text-4xl font-bold tracking-wide">
                HT
              </span>
            </div>
          </div>
          <h1 className="text-3xl text-[#1C1C1C] mb-2">Hamed Telecom</h1>
          <p className="text-[#6B7280]">Gestion de magasin</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xl text-[#1C1C1C] mb-6">Connexion</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pseudo">Pseudo</Label>
              <Input
                id="pseudo"
                type="text"
                placeholder="Entrez votre pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="h-11 border-gray-200"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-gray-200"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#1A7A4A] hover:bg-[#145C38] text-white"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}