import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function DashboardLayout({ navItems, subtitle }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)
  const openSidebar = () => setSidebarOpen(true)

  const handleLogout = () => {
    setLogoutConfirmOpen(true)
  }

  const confirmLogout = () => {
    setLogoutConfirmOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only">{t('skip_to_content')}</a>

      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 w-[280px] h-screen py-sm bg-gradient-to-b from-white to-surface-container-low border-r border-outline-variant/20 shadow-sm z-30 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="px-6 pb-8 pt-6 flex justify-between items-center">
          <div>
            <p className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">GrowWell</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{subtitle}</p>
          </div>
          <button className="md:hidden p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors" onClick={closeSidebar}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto mt-2 px-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-primary font-bold bg-primary/10 shadow-sm ring-1 ring-primary/5'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`material-symbols-outlined ${isActive ? 'filled-icon' : ''}`}>{item.icon}</span>
                      <span className="font-label-md text-label-md">{t(item.label)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Navigation */}
        <div className="mt-auto px-4 pb-6 pt-4 border-t border-outline-variant/20">
          <ul className="flex flex-col gap-1">
            <li>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-colors duration-200">
                <span className="material-symbols-outlined">logout</span>
                <span className="font-label-md text-label-md">{t('auth_logout')}</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={closeSidebar}></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-[280px] w-full md:w-[calc(100%-280px)] min-h-screen bg-background">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-8 py-3 bg-white/90 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-10">
          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-low rounded-full" onClick={openSidebar}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Mobile Brand */}
          <span className="md:hidden font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">GrowWell</span>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4 ml-auto">
            <LanguageToggle />
            <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border border-primary/20 shadow-sm flex-shrink-0 cursor-pointer hover:bg-primary/15 transition-colors flex items-center justify-center text-primary font-bold">
              {user?.nama_lengkap?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main id="main-content" className="flex-1 overflow-x-hidden p-4 md:p-lg lg:px-xl">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title={t('auth_logout')}
        message={t('confirm_logout', 'Are you sure you want to logout?')}
        confirmLabel={t('auth_logout')}
        confirmVariant="primary"
      />
    </>
  )
}
