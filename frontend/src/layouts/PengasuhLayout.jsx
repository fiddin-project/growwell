import { useTranslation } from 'react-i18next'
import DashboardLayout from './DashboardLayout'

const navItems = [
  { to: '/pengasuh/dashboard', icon: 'dashboard', label: 'nav_dashboard' },
  { to: '/pengasuh/screening', icon: 'stethoscope', label: 'nav_screening' },
  { to: '/pengasuh/edukasi', icon: 'menu_book', label: 'nav_education' },
  { to: '/pengasuh/monitoring', icon: 'monitoring', label: 'nav_monitoring' },
  { to: '/pengasuh/psikolog', icon: 'psychology', label: 'nav_psychologist' },
]

export default function PengasuhLayout() {
  const { t } = useTranslation()
  return <DashboardLayout navItems={navItems} subtitle={t('app_tagline')} />
}
