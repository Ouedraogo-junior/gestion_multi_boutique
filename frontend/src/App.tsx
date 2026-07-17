import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { BoutiqueProvider } from './contexts/BoutiqueContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import { useEffect } from 'react'
import { getBoutique } from '@/api/boutiques'
import { useBoutique } from '@/hooks/useBoutique'
import { useAuth } from '@/hooks/useAuth'

// Paramètres & boutique
import BoutiquesPage from './pages/boutiques/BoutiquesPage'
import ParametresPage from './pages/parametres/ParametresPage'

// Produits
import ProduitsPage      from './pages/produits/ProduitsPage'
import ProduitFormPage   from './pages/produits/ProduitFormPage'
import ProduitDetailPage from './pages/produits/ProduitDetailPage'

// Ventes
import VentesPage       from './pages/ventes/VentesPage'
import NouvelleVentePage from './pages/ventes/NouvelleVentePage'
import VenteDetailPage  from './pages/ventes/VenteDetailPage'

// Clients
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetailPage from './pages/clients/ClientDetailPage'

// Dépenses
import DepensesPage from './pages/depenses/DepensesPage'

// Retour
import RetoursPage from './pages/retours/RetoursPage'

// Rapports
import RapportsPage from './pages/rapports/RapportsPage'

// Dashboard
import DashboardAdmin      from './pages/dashboard/DashboardAdmin'
import DashboardVendeur    from './pages/dashboard/DashboardVendeur'
import DashboardSuperAdmin from './pages/dashboard/DashboardSuperAdmin'

// Utilisateurs
import UtilisateursPage from '@/pages/utilisateurs/UtilisateursPage'

// Audit
import AuditPage from '@/pages/audit/AuditPage'

// Approvisionnements
import ApprovisionnementsPage      from '@/pages/approvisionnements/ApprovisionnемentsPage'
import ReceptionMarchandisesPage from '@/pages/approvisionnements/ReceptionMarchandisesPage'
import NouvelApprovisionnementPage from '@/pages/approvisionnements/NouvelApprovisionnementPage'
import ApprovisionnementDetailPage from '@/pages/approvisionnements/ApprovisionnementDetailPage'
import DettesFournisseursPage from '@/pages/approvisionnements/DettesFournisseursPage'

// Activité
import ActivitesPage from './pages/activites/ActivitesPage'

// Transferts inter-boutiques
import TransfertsBoutiquesPage from './pages/transferts-boutiques/TransfertsBoutiquesPage'
import NouveauTransfertPage from './pages/transferts-boutiques/NouveauTransfertPage'
import TransfertBoutiqueDetailPage from './pages/transferts-boutiques/TransfertBoutiqueDetailPage'



import { ROLES } from './utils/constants'

function DashboardBoutiqueRoute() {
  const { user } = useAuth()
  return user?.role === ROLES.VENDEUR ? <DashboardVendeur /> : <DashboardAdmin />
}

function BoutiqueRefresher() {
  const { user, token, ready } = useAuth()
  const { setBoutiqueActive } = useBoutique()

  useEffect(() => {
    if (!ready || !user?.boutique_id || !token) return
    getBoutique(user.boutique_id).then(res => setBoutiqueActive(res.data))
  }, [ready, user?.boutique_id, token])

  return null
}


// const Todo = ({ label }: { label: string }) => (
//   <div className="p-8 text-gray-400 text-center">{label} — à implémenter</div>
// )

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BoutiqueProvider>
          <BoutiqueRefresher />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
                  <DashboardSuperAdmin />
                </ProtectedRoute>
              } />

              {/* Routes boutiques */}
              <Route path="/boutiques" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
                  <BoutiquesPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/dashboard" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <DashboardBoutiqueRoute />
                </ProtectedRoute>
              } />

              <Route path="/boutiques/:boutiqueId/approvisionnements/reception" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <ReceptionMarchandisesPage />
                </ProtectedRoute>
              } />

              {/* Routes produits */}
              <Route path="/boutiques/:boutiqueId/produits" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ProduitsPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/produits/nouveau" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ProduitFormPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/produits/:produitId" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ProduitDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/produits/:produitId/modifier" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ProduitFormPage />
                </ProtectedRoute>
              } />

              {/* Routes ventes */}
              <Route path="/boutiques/:boutiqueId/ventes" element={
                <ProtectedRoute>
                  <VentesPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/ventes/nouvelle" element={
                <ProtectedRoute>
                  <NouvelleVentePage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/ventes/:vid" element={
                <ProtectedRoute roles={['super_admin', 'admin_boutique', 'vendeur']}>
                  <VenteDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/ventes/:vid/continuer" element={
                <ProtectedRoute>
                  <NouvelleVentePage />
                </ProtectedRoute>
              } />

              {/* Clients */}
              <Route path="/boutiques/:boutiqueId/clients" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ClientsPage />
                </ProtectedRoute>
              } />

              <Route path="/boutiques/:boutiqueId/clients/:clientId" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ClientDetailPage />
                </ProtectedRoute>
              } />


              <Route path="/boutiques/:boutiqueId/depenses" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE]}>
                  <DepensesPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/retours" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <RetoursPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/rapports" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE]}>
                  <RapportsPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/utilisateurs" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE]}>
                  <UtilisateursPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/parametres" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN]}>
                  <ParametresPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/audit" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN]}>
                  <AuditPage />
                </ProtectedRoute>
              } />

              {/* Approvisionnements — nouveau AVANT /:id */}
              <Route path="/boutiques/:boutiqueId/approvisionnements" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <ApprovisionnementsPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/approvisionnements/nouveau" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <NouvelApprovisionnementPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/approvisionnements/:approId" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <ApprovisionnementDetailPage /> 
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/dettes-fournisseurs" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <DettesFournisseursPage />
                </ProtectedRoute>
              } />

              {/* Activités */}
              <Route path="/boutiques/:boutiqueId/activites" element={
                <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN_BOUTIQUE, ROLES.VENDEUR]}>
                  <ActivitesPage />
                </ProtectedRoute>
              } />

              {/* Transferts inter-boutiques — nouveau AVANT /:id */}
              <Route path="/boutiques/:boutiqueId/transferts-boutiques" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <TransfertsBoutiquesPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/transferts-boutiques/nouveau" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <NouveauTransfertPage />
                </ProtectedRoute>
              } />
              <Route path="/boutiques/:boutiqueId/transferts-boutiques/:id" element={
                <ProtectedRoute roles={[ROLES.ADMIN_BOUTIQUE, ROLES.SUPER_ADMIN, ROLES.VENDEUR]}>
                  <TransfertBoutiqueDetailPage />
                </ProtectedRoute>
              } />

            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          <Toaster position="top-right" richColors />
        </BoutiqueProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}