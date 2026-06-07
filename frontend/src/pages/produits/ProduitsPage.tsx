import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getProduits, toggleProduit } from '@/api/produits'
import type { Produit } from '@/api/produits'
import ProduitTable from './components/ProduitTable'
import { toast } from 'sonner'
import { deleteProduit } from '@/api/produits'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export default function ProduitsPage() {
  const { boutiqueId } = useParams()
  const navigate        = useNavigate()
  const id              = Number(boutiqueId)

  const [produits, setProduits]   = useState<Produit[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Produit | null>(null)

  const load = async () => {
    try {
        const res = await getProduits(id, { search, per_page: 100 })
        const data = res.data?.data ?? res.data
        // console.log(data)
        setProduits(Array.isArray(data) ? data : [])
    } finally {
        setLoading(false)
    }
}

  useEffect(() => { load() }, [id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const handleToggle = async (p: Produit) => {
    await toggleProduit(id, p.id)
    toast.success(`Produit ${p.actif ? 'désactivé' : 'activé'}`)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteProduit(id, deleteTarget.id)
    toast.success('Produit supprimé')
    setDeleteTarget(null)
    load()
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1C1C1C]">Produits</h1>
          <p className="text-gray-500 text-sm mt-1">{produits.length} produit{produits.length > 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => navigate(`/boutiques/${id}/produits/nouveau`)}
          className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
        >
          <Plus size={18} className="mr-2" />
          Ajouter un produit
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-10 border-gray-200"
            />
          </div>
          <Button type="submit" variant="outline" className="border-gray-200">
            Rechercher
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : produits.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun produit</div>
        ) : (
        <>
        <ProduitTable
            produits={produits}
            boutiqueId={id}
            onToggle={handleToggle}
            onDelete={setDeleteTarget}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>
                    "{deleteTarget?.designation}" sera supprimé définitivement avec toutes ses variantes.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-[#E8314A] hover:bg-red-700 text-white"
                >
                    Supprimer
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </>
        )}
      </div>
    </div>
  )
}