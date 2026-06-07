import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getBoutiques, toggleBoutique } from '@/api/boutiques'
import type { Boutique } from '@/contexts/BoutiqueContext'
import BoutiqueCard from './components/BoutiqueCard'
import BoutiqueForm from './components/BoutiqueForm'
import { toast } from 'sonner'

export default function BoutiquesPage() {
  const [boutiques, setBoutiques]     = useState<Boutique[]>([])
  const [loading, setLoading]         = useState(true)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [selected, setSelected]       = useState<Boutique | undefined>()

  const load = async () => {
    try {
      const res = await getBoutiques()
      setBoutiques(res.data)
      //console.log(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleEdit = (b: Boutique) => {
    setSelected(b)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelected(undefined)
    setDialogOpen(true)
  }

  const handleToggle = async (b: Boutique) => {
    await toggleBoutique(b.id)
    toast.success(`Boutique ${b.actif ? 'désactivée' : 'activée'}`)
    load()
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    toast.success(selected ? 'Boutique modifiée' : 'Boutique créée')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Boutiques</h1>
          <p className="text-gray-500 text-sm mt-1">{boutiques.length} boutique{boutiques.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleNew} className="bg-[#1A7A4A] hover:bg-[#145C38] text-white">
          <Plus size={18} className="mr-2" />
          Nouvelle boutique
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : boutiques.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune boutique</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {boutiques.map(b => (
            <BoutiqueCard key={b.id} boutique={b} onEdit={handleEdit} onToggle={handleToggle} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected ? 'Modifier la boutique' : 'Nouvelle boutique'}</DialogTitle>
          </DialogHeader>
          <BoutiqueForm
            boutique={selected}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}