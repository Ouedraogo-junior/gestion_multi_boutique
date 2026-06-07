import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getReferentiels, createReferentiel, updateReferentiel, deleteReferentiel } from '@/api/referentiels'
import type { Referentiel } from '@/api/referentiels'
import { TYPES_REFERENTIEL } from '@/utils/constants'
import { toast } from 'sonner'

interface Props { boutiqueId: number }

const TABS = [
  { key: TYPES_REFERENTIEL.CATEGORIE_PRODUIT,  label: 'Catégories produits'  },
  { key: TYPES_REFERENTIEL.ATTRIBUT_VARIANTE,  label: 'Attributs variantes'  },
  { key: TYPES_REFERENTIEL.CATEGORIE_DEPENSE,  label: 'Catégories dépenses'  },
  { key: TYPES_REFERENTIEL.OPERATEUR_MM,       label: 'Opérateurs MM'        },
  { key: TYPES_REFERENTIEL.MOTIF_RETOUR,       label: 'Motifs retour'        },
]

function ReferentielList({ boutiqueId, type }: { boutiqueId: number; type: string }) {
  const [items, setItems]       = useState<Referentiel[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [editId, setEditId]     = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const load = async () => {
    const res = await getReferentiels(boutiqueId, type)
    const data = Array.isArray(res.data) ? res.data : []
    setItems(data)
 }

  useEffect(() => { load() }, [boutiqueId, type])

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    await createReferentiel(boutiqueId, { type, libelle: newLabel.trim() })
    setNewLabel('')
    toast.success('Ajouté')
    load()
  }

  const handleUpdate = async (id: number) => {
    if (!editLabel.trim()) return
    await updateReferentiel(boutiqueId, id, { libelle: editLabel.trim() })
    setEditId(null)
    toast.success('Modifié')
    load()
  }

  const handleDelete = async (id: number) => {
    await deleteReferentiel(boutiqueId, id)
    toast.success('Supprimé')
    load()
  }

  return (
    <div className="space-y-3">
      {/* Ajout */}
      <div className="flex gap-2">
        <Input
          placeholder="Nouveau libellé..."
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="h-9"
        />
        <Button onClick={handleAdd} size="sm" className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          <Plus size={16} />
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-1.5">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucun élément</p>
        )}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50">
            {editId === item.id ? (
              <>
                <Input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="h-8 flex-1"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)}
                />
                <button onClick={() => handleUpdate(item.id)} className="text-[#1A7A4A] hover:text-[#145C38]">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700">{item.libelle}</span>
                <button
                  onClick={() => { setEditId(item.id); setEditLabel(item.libelle) }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-[#E8314A]">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SectionReferentiels({ boutiqueId }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg text-[#1C1C1C]">Référentiels</h2>
      <Tabs defaultValue={TYPES_REFERENTIEL.CATEGORIE_PRODUIT}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <ReferentielList boutiqueId={boutiqueId} type={t.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}