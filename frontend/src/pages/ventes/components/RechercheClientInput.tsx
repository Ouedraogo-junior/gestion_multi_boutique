import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Plus, Check, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getClients, createClient } from '@/api/clients'
import type { Client } from '@/api/clients'
import { toast } from 'sonner'

interface Props {
  boutiqueId: number
  clientId: string
  /** Appelé avec l'id du client sélectionné ("0" = anonyme, "" = aucun) */
  onChange: (clientId: string) => void
  /** Requis visuellement (vente à crédit) */
  required?: boolean
}

interface NouveauClient {
  nom: string
  prenom: string
  telephone: string
}

const vide: NouveauClient = { nom: '', prenom: '', telephone: '' }

export default function RechercheClientInput({ boutiqueId, clientId, onChange, required }: Props) {
  const [clients, setClients]           = useState<Client[]>([])
  const [query, setQuery]               = useState('')
  const [ouvert, setOuvert]             = useState(false)
  const [mode, setMode]                 = useState<'recherche' | 'creation'>('recherche')
  const [nouveauClient, setNouveauClient] = useState<NouveauClient>(vide)
  const [creating, setCreating]         = useState(false)
  const [loaded, setLoaded]             = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  /* ── Chargement unique des clients ── */
  useEffect(() => {
    if (loaded) return
    getClients(boutiqueId, { per_page: 500 }).then(res => {
      const data = res.data?.data ?? res.data
      setClients(Array.isArray(data) ? data : [])
      setLoaded(true)
    })
  }, [boutiqueId, loaded])

  /* ── Fermeture au clic extérieur ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOuvert(false)
        setMode('recherche')
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Client sélectionné ── */
  const clientSelectionne = clientId && clientId !== '0'
    ? clients.find(c => String(c.id) === clientId) ?? null
    : null

  /* ── Filtrage ── */
  const q = query.trim().toLowerCase()
  const resultats: Client[] = q.length < 1
    ? clients.slice(0, 50)
    : clients.filter(c => {
        const nom      = c.nom.toLowerCase()
        const prenom   = (c.prenom ?? '').toLowerCase()
        const tel      = (c.telephone ?? '').toLowerCase()
        const fullname = `${prenom} ${nom}`.trim()
        return nom.includes(q) || prenom.includes(q) || tel.includes(q) || fullname.includes(q)
      })

  /* ── Sélection ── */
  const selectionner = useCallback((id: string) => {
    onChange(id)
    setOuvert(false)
    setQuery('')
    setMode('recherche')
  }, [onChange])

  const deselecter = () => {
    onChange('0')
    setQuery('')
  }

  /* ── Ouverture dropdown ── */
  const ouvrir = () => {
    setOuvert(true)
    setMode('recherche')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* ── Création ── */
  const handleCreer = async () => {
    if (!nouveauClient.nom.trim()) {
      toast.error('Le nom est requis')
      return
    }
    setCreating(true)
    try {
      const res = await createClient(boutiqueId, {
        nom:       nouveauClient.nom.trim(),
        prenom:    nouveauClient.prenom.trim() || undefined,
        telephone: nouveauClient.telephone.trim() || undefined,
      })
      const client: Client = res.data
      setClients(prev => [client, ...prev])
      selectionner(String(client.id))
      setNouveauClient(vide)
      toast.success(`Client ${client.prenom ? client.prenom + ' ' : ''}${client.nom} créé`)
    } catch {
      toast.error('Erreur lors de la création du client')
    } finally {
      setCreating(false)
    }
  }

  /* ── Label du client sélectionné ── */
  const labelClient = (c: Client) =>
    `${c.prenom ? c.prenom + ' ' : ''}${c.nom}${c.telephone ? ' · ' + c.telephone : ''}`

  /* ════════════════════════════════════════ */
  return (
    <div ref={containerRef} className="relative">

      {/* ── Champ déclencheur ── */}
      {clientSelectionne ? (
        /* Client sélectionné */
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 bg-[#F4F6F5] text-sm">
          <User size={14} className="text-[#1A7A4A] shrink-0" />
          <span className="flex-1 truncate text-gray-800">{labelClient(clientSelectionne)}</span>
          <button
            type="button"
            onClick={deselecter}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Retirer le client"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Aucun client — champ recherche */
        <div
          className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 bg-white cursor-text"
          onClick={ouvrir}
        >
          <Search size={14} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-400">
            {ouvert ? '' : 'Rechercher un client…'}
          </span>
        </div>
      )}

      {/* ── Dropdown ── */}
      {ouvert && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">

          {mode === 'recherche' ? (
            <>
              {/* Barre de recherche interne */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Nom, prénom ou téléphone…"
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Liste */}
              <ul className="max-h-52 overflow-y-auto py-1">

                {/* Client anonyme */}
                <li>
                  <button
                    type="button"
                    onClick={() => selectionner('0')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    {(clientId === '0' || clientId === '') && <Check size={13} className="text-[#1A7A4A] shrink-0" />}
                    <span className={clientId === '0' || clientId === '' ? 'ml-0' : 'ml-[17px]'}>
                      Client anonyme
                    </span>
                  </button>
                </li>

                {/* Séparateur */}
                {resultats.length > 0 && <li className="border-t border-gray-100 mx-2 my-1" />}

                {/* Résultats */}
                {resultats.map(c => {
                  const actif = String(c.id) === clientId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => selectionner(String(c.id))}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {actif
                          ? <Check size={13} className="text-[#1A7A4A] shrink-0" />
                          : <span className="w-[13px] shrink-0" />
                        }
                        <span className="flex-1 text-left truncate text-gray-800">
                          {c.prenom ? <><strong>{c.prenom}</strong> {c.nom}</> : <strong>{c.nom}</strong>}
                        </span>
                        {c.telephone && (
                          <span className="text-xs text-gray-400 shrink-0">{c.telephone}</span>
                        )}
                      </button>
                    </li>
                  )
                })}

                {/* Aucun résultat */}
                {q.length > 0 && resultats.length === 0 && (
                  <li className="px-3 py-3 text-sm text-gray-400 text-center">
                    Aucun client trouvé pour « {query} »
                  </li>
                )}
              </ul>

              {/* Pied : bouton création */}
              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={() => { setMode('creation'); setNouveauClient(vide) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A7A4A] hover:bg-[#F4F6F5] rounded-lg transition-colors font-medium"
                >
                  <Plus size={14} />
                  Nouveau client
                </button>
              </div>
            </>
          ) : (
            /* ── Formulaire création ── */
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Nouveau client</span>
                <button
                  type="button"
                  onClick={() => { setMode('recherche'); setNouveauClient(vide) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
              <Input
                autoFocus
                placeholder="Nom *"
                value={nouveauClient.nom}
                onChange={e => setNouveauClient(p => ({ ...p, nom: e.target.value }))}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Prénom"
                value={nouveauClient.prenom}
                onChange={e => setNouveauClient(p => ({ ...p, prenom: e.target.value }))}
                className="h-8 text-sm"
              />
              <Input
                placeholder="Téléphone"
                value={nouveauClient.telephone}
                onChange={e => setNouveauClient(p => ({ ...p, telephone: e.target.value }))}
                className="h-8 text-sm"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-gray-200"
                  onClick={() => { setMode('recherche'); setNouveauClient(vide) }}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={creating || !nouveauClient.nom.trim()}
                  onClick={handleCreer}
                  className="flex-1 h-8 text-xs bg-[#1A7A4A] hover:bg-[#145C38] text-white"
                >
                  {creating ? 'Création...' : 'Créer et sélectionner'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur crédit */}
      {required && (!clientId || clientId === '0') && (
        <p className="text-xs text-[#E8314A] mt-1">Un client est requis pour une vente à crédit</p>
      )}
    </div>
  )
}