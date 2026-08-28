import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRapportCA, getRapportStock, getRapportDettes, getRapportDettesFournisseurs, getRapportDepenses, getRapportConsolide } from '@/api/rapports'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { toast } from 'sonner'
import TabCA from './components/TabCA'
import TabDettes from './components/TabDettes'
import TabDettesFournisseurs from './components/TabDettesFournisseurs'
import TabDepenses from './components/TabDepenses'
import TabStock from './components/TabStock'
import TabConsolide from './components/TabConsolide'
import { exportRapport, exportConsolide } from '@/api/rapports'


type TabKey = 'ca' | 'stock' | 'dettes' | 'fournisseurs' | 'depenses' | 'consolide'

const TABS: { key: TabKey; label: string; needsDate: boolean }[] = [
  { key: 'ca',           label: 'CA',                  needsDate: true  },
  { key: 'stock',        label: 'Stock',                needsDate: false },
  { key: 'dettes',       label: 'Dette client',         needsDate: true  },
  { key: 'fournisseurs', label: 'Dette fournisseurs',   needsDate: true  },
  { key: 'depenses',     label: 'Dépenses',             needsDate: true  },
  { key: 'consolide',    label: 'Consolidé',            needsDate: true  },
]

export default function RapportsPage() {
  const { boutiqueId } = useParams()
  const id = Number(boutiqueId)
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const today    = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [activeTab,      setActiveTab]      = useState<TabKey>('ca')
  const [debut,          setDebut]          = useState(firstDay)
  const [fin,            setFin]            = useState(today)
  const [loading,        setLoading]        = useState(false)
  const [data,           setData]           = useState<Record<string, unknown> | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const currentTab = TABS.find(t => t.key === activeTab)!
  const tabs       = isSuperAdmin ? TABS : TABS.filter(t => t.key !== 'consolide')

  const triggerDownload = (blob: Blob, filename: string) => {
    const url  = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    let cancelled = false  // ← flag simple et fiable

    const load = async () => {
        setLoading(true)
        setData(null)
        try {
        let res
        const params = { debut, fin }
        switch (activeTab) {
            case 'ca':           res = await getRapportCA(id, params);                break
            case 'stock':        res = await getRapportStock(id);                     break
            case 'dettes':       res = await getRapportDettes(id, params);             break
            case 'fournisseurs': res = await getRapportDettesFournisseurs(id, params); break
            case 'depenses':     res = await getRapportDepenses(id, params);           break
            case 'consolide':    res = await getRapportConsolide(params);              break
        }

        if (cancelled) return  // ← on ignore si le tab a changé entre temps

        setData(res.data)
        } catch {
        if (!cancelled) toast.error('Erreur lors du chargement du rapport')
        } finally {
        if (!cancelled) setLoading(false)
        }
    }

    load()

    return () => { cancelled = true }  // ← cleanup au changement de tab
    }, [activeTab, id, refreshTrigger])


    const handleExportPDF = async () => {
    try {
      const params = { debut, fin, format: 'pdf', type: activeTab }
      const res = activeTab === 'consolide'
        ? await exportConsolide(params)
        : await exportRapport(id, params)
      triggerDownload(new Blob([res.data], { type: 'application/pdf' }), `rapport-${activeTab}-${debut}.pdf`)
    } catch {
      toast.error('Erreur export PDF')
    }
  }

  const handleExportExcel = async () => {
    try {
      const params = { debut, fin, format: 'excel', type: activeTab }
      const res = activeTab === 'consolide'
        ? await exportConsolide(params)
        : await exportRapport(id, params)
      triggerDownload(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `rapport-${activeTab}-${debut}.xlsx`)
    } catch {
      toast.error('Erreur export Excel')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Analyses et statistiques</p>
      </div>

      {/* Filtres date + export */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {currentTab.needsDate && (
            <>
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Du</Label>
                <Input type="date" value={debut} onChange={e => setDebut(e.target.value)} className="border-gray-200 w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-500">Au</Label>
                <Input type="date" value={fin} onChange={e => setFin(e.target.value)} className="border-gray-200 w-40" />
              </div>
              <Button
                onClick={() => setRefreshTrigger(n => n + 1)}
                className="bg-[#1A7A4A] hover:bg-[#145C38] text-white"
              >
                Actualiser
              </Button>
            </>
          )}
          <div className="flex-1" />
          <div className="flex gap-2">
            
              <Button variant="outline" onClick={handleExportPDF}
                className="border-red-200 text-red-500 hover:bg-red-50 gap-2">
                <FileText size={16} />PDF
              </Button>
            
            <Button variant="outline" onClick={handleExportExcel}
              className="border-[#1A7A4A] text-[#1A7A4A] hover:bg-[#D4F0E2] gap-2">
              <Download size={16} />Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`py-4 px-2 border-b-2 text-sm transition-colors ${
                  activeTab === t.key
                    ? 'border-[#1A7A4A] text-[#1A7A4A] font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Chargement...</div>
          ) : !data ? (
            <div className="text-center py-16 text-gray-400">Aucune donnée</div>
          ) : (
            <>
              {activeTab === 'ca'           && <TabCA               data={data as Parameters<typeof TabCA>[0]['data']}               />}
              {activeTab === 'dettes'       && <TabDettes           data={data as Parameters<typeof TabDettes>[0]['data']}           />}
              {activeTab === 'fournisseurs' && <TabDettesFournisseurs data={data as Parameters<typeof TabDettesFournisseurs>[0]['data']} />}
              {activeTab === 'depenses'     && <TabDepenses         data={data as Parameters<typeof TabDepenses>[0]['data']}         />}
              {activeTab === 'stock'        && <TabStock            data={data as Parameters<typeof TabStock>[0]['data']}            />}
              {activeTab === 'consolide'    && <TabConsolide        data={data as Parameters<typeof TabConsolide>[0]['data']}        />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}