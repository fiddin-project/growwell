import { useTranslation } from 'react-i18next'
import DashboardLayout from './DashboardLayout'

const navItems = [
  { to: '/admin/dashboard', icon: 'dashboard', label: 'nav_dashboard' },
  { to: '/admin/users', icon: 'supervisor_account', label: 'nav_users' },
  { to: '/admin/skala', icon: 'straighten', label: 'nav_skala' },
  { to: '/admin/pertanyaan', icon: 'quiz', label: 'nav_questions' },
  { to: '/admin/ambang-batas', icon: 'rule_folder', label: 'nav_thresholds' },
  { to: '/admin/anak', icon: 'child_care', label: 'nav_children' },
  { to: '/admin/edukasi', icon: 'menu_book', label: 'nav_education' },
  { to: '/admin/psikolog', icon: 'psychology', label: 'nav_psychologist' },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  return <DashboardLayout navItems={navItems} subtitle={t('admin_dashboard')} />
}
