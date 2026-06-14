import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import PengasuhLayout from './layouts/PengasuhLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import SkalaPage from './pages/admin/SkalaPage'
import PertanyaanPage from './pages/admin/PertanyaanPage'
import AmbangBatasPage from './pages/admin/AmbangBatasPage'
import AnakPage from './pages/admin/AnakPage'
import AdminEdukasiPage from './pages/admin/EdukasiPage'
import AdminPsikologPage from './pages/admin/PsikologPage'
import PengasuhDashboardPage from './pages/pengasuh/DashboardPage'
import ScreeningChildSelectPage from './pages/pengasuh/screening/ChildSelectPage'
import NewChildPage from './pages/pengasuh/screening/NewChildPage'
import QuestionnairePage from './pages/pengasuh/screening/QuestionnairePage'
import ResultPage from './pages/pengasuh/screening/ResultPage'
import PengasuhEdukasiPage from './pages/pengasuh/EdukasiPage'
import MonitoringSelectPage from './pages/pengasuh/MonitoringSelectPage'
import MonitoringDetailPage from './pages/pengasuh/MonitoringDetailPage'
import PengasuhPsikologPage from './pages/pengasuh/PsikologPage'

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
          <Route path="screening/new-child" element={<NewChildPage />} />
          <Route path="screening/:childId" element={<QuestionnairePage />} />
          <Route path="screening/:childId/result/:skriningId" element={<ResultPage />} />
          <Route path="edukasi" element={<PengasuhEdukasiPage />} />
          <Route path="monitoring" element={<MonitoringSelectPage />} />
          <Route path="monitoring/:childId" element={<MonitoringDetailPage />} />
          <Route path="psikolog" element={<PengasuhPsikologPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
