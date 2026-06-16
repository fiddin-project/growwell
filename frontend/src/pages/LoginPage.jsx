import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.success) {
        toast.success(t('toast_welcome', { name: username }))
        if (result.role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
        else navigate('/pengasuh/dashboard', { replace: true })
      } else {
        toast.error(t('auth_login_error'))
      }
    } catch (err) {
      console.error('Login failed:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setLoading(false)
    }
  }

  const handleMouseMove = useCallback((e) => {
    const amount = 20
    const x = (e.clientX / window.innerWidth - 0.5) * amount
    const y = (e.clientY / window.innerHeight - 0.5) * amount
    document.querySelectorAll('.login-blur-circle').forEach(el => {
      el.style.transform = `translate(${x}px, ${y}px)`
    })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-primary-fixed-dim selection:text-primary overflow-x-hidden bg-gradient-to-br from-surface-container-low via-canvas-parchment to-surface-container-low">
      <main className="flex-grow flex items-center justify-center px-8 py-16 relative">
        {/* Decorative background circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="login-blur-circle absolute -top-[10%] -left-[5%] w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-primary-fixed-dim/10 rounded-full blur-3xl transition-transform duration-300 ease-out" />
          <div className="login-blur-circle absolute -bottom-[10%] -right-[5%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-secondary-fixed-dim/10 rounded-full blur-3xl transition-transform duration-300 ease-out" />
        </div>

        {/* Language toggle */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>

        {/* Login card */}
        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-xl p-6 md:p-10 border border-[rgba(0,67,73,0.08)] shadow-[0_1px_3px_rgba(0,67,73,0.04),0_8px_32px_rgba(0,67,73,0.08)] flex flex-col gap-6 transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,67,73,0.06),0_12px_40px_rgba(0,67,73,0.1)] page-enter">
          {/* Brand logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">eco</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t('login_title', 'Login')}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('login_subtitle', 'Sign in to GrowWell Admin Panel')}</p>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Username field */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="login-username">
                {t('auth_username')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  id="login-username"
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-white transition-all focus:shadow-[0_0_0_2px_rgba(32,104,111,0.2)]"
                  placeholder={t('auth_username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="login-password">
                {t('auth_password')}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-white transition-all focus:shadow-[0_0_0_2px_rgba(32,104,111,0.2)]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('hide_password') : t('show_password')}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-label-md text-label-md rounded-lg shadow-lg hover:shadow-xl hover:from-primary-container hover:to-primary-focus hover:text-on-primary transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth_login_btn', 'Sign In')}
                  <span className="material-symbols-outlined">login</span>
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  )
}
