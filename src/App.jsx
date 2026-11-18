import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import { useAuth } from './context/auth'
import { useI18n } from './context/i18n'
import Navbar from './components/Navbar'
import CrisisBanner from './components/CrisisBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import { NotFound } from './pages/PlaceholderPages'
import Admin from './pages/Admin'
import Analytics from './pages/Analytics'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import Referrals from './pages/Referrals'
import Support from './pages/Support'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import Results from './pages/Results'
import Consent from './pages/Consent'
import Privacy from './pages/Privacy'

function ReferralHome() {
  const { role } = useAuth()
  return role === 'professional' ? <Navigate to="/professional" replace /> : <Referrals />
}

function AppShell() {
  const { t } = useI18n()
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route element={<ProtectedRoute requireConsent={false} />}>
            <Route path="/consent" element={<Consent />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/results" element={<Dashboard />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/support" element={<Support />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['individual', 'professional']} />}>
            <Route path="/referrals" element={<ReferralHome />} />
            <Route element={<ProtectedRoute allowedRoles={['professional']} />}>
              <Route path="/my-referrals" element={<Referrals />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['professional', 'admin']} />}>
            <Route path="/professional" element={<ProfessionalDashboard mode="professional" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['primary_care', 'admin']} />}>
            <Route path="/primary-care" element={<ProfessionalDashboard mode="primary_care" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['coordinator', 'admin']} />}>
            <Route path="/coordinator" element={<ProfessionalDashboard mode="coordinator" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['analyst', 'admin']} />}>
            <Route path="/analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">{t.footer}</footer>
      <CrisisBanner />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
