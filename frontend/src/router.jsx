import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import PengasuhLayout from './layouts/PengasuhLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const SkalaPage = lazy(() => import('./pages/admin/SkalaPage'))
const PertanyaanPage = lazy(() => import('./pages/admin/PertanyaanPage'))
const AmbangBatasPage = lazy(() => import('./pages/admin/AmbangBatasPage'))
const AnakPage = lazy(() => import('./pages/admin/AnakPage'))
const AdminEdukasiPage = lazy(() => import('./pages/admin/EdukasiPage'))
const AdminPsikologPage = lazy(() => import('./pages/admin/PsikologPage'))
const PengasuhDashboardPage = lazy(() => import('./pages/pengasuh/DashboardPage'))
const ScreeningChildSelectPage = lazy(() => import('./pages/pengasuh/screening/ChildSelectPage'))
const QuestionnairePage = lazy(() => import('./pages/pengasuh/screening/QuestionnairePage'))
const ResultPage = lazy(() => import('./pages/pengasuh/screening/ResultPage'))
const PengasuhEdukasiPage = lazy(() => import('./pages/pengasuh/EdukasiPage'))
const MonitoringSelectPage = lazy(() => import('./pages/pengasuh/MonitoringSelectPage'))
const MonitoringDetailPage = lazy(() => import('./pages/pengasuh/MonitoringDetailPage'))
const PengasuhPsikologPage = lazy(() => import('./pages/pengasuh/PsikologPage'))

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-parchment">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'PENGASUH') return <Navigate to="/pengasuh/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="skala" element={<SkalaPage />} />
          <Route path="pertanyaan" element={<PertanyaanPage />} />
          <Route path="ambang-batas" element={<AmbangBatasPage />} />
          <Route path="anak" element={<AnakPage />} />
          <Route path="edukasi" element={<AdminEdukasiPage />} />
          <Route path="psikolog" element={<AdminPsikologPage />} />
        </Route>

        <Route
          path="/pengasuh"
          element={
            <ProtectedRoute role="PENGASUH">
              <PengasuhLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PengasuhDashboardPage />} />
          <Route path="screening" element={<ScreeningChildSelectPage />} />
          <Route path="screening/:childId" element={<QuestionnairePage />} />
          <Route path="screening/:childId/result/:skriningId" element={<ResultPage />} />
          <Route path="edukasi" element={<PengasuhEdukasiPage />} />
          <Route path="monitoring" element={<MonitoringSelectPage />} />
          <Route path="monitoring/:childId" element={<MonitoringDetailPage />} />
          <Route path="psikolog" element={<PengasuhPsikologPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
