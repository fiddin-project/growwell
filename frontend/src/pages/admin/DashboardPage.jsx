import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, ClipboardList, TrendingUp, AlertTriangle, LayoutDashboard } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import * as api from '../../api/admin'

const COLORS = ['#15803d', '#92400e', '#93000a']

function normalizeCategories(input) {
  if (Array.isArray(input)) return input
  return Object.entries(input).map(([name, value]) => ({ name, value }))
}

function normalizeMonthlyData(input) {
  if (Array.isArray(input)) {
    return input.map((item) => ({
      month: item.month || item.bulan,
      count: item.count,
    }))
  }
  return Object.entries(input).map(([month, count]) => ({ month, count }))
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const monthKeys = ['month_jan', 'month_feb', 'month_mar', 'month_apr', 'month_may', 'month_jun', 'month_jul', 'month_aug', 'month_sep', 'month_oct', 'month_nov', 'month_dec']
  const monthLabels = useMemo(() => monthKeys.map((k) => t(k)), [t])

  useEffect(() => {
    api.getDashboard()
      .then(setDashData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const totalPengasuh = dashData?.totalPengasuh ?? 0
  const totalSkrining = dashData?.totalSkrining ?? 0

  const screeningThisMonth = useMemo(() => {
    if (dashData?.skriningPerBulan) {
      const normalized = normalizeMonthlyData(dashData.skriningPerBulan)
      const currentLabel = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      const entry = normalized.find((m) => m.month === currentLabel)
      return entry?.count ?? 0
    }
    return 0
  }, [dashData, currentMonth, currentYear])

  const percentAbnormal = useMemo(() => {
    if (dashData?.distribusiKategori && totalSkrining > 0) {
      const cats = normalizeCategories(dashData.distribusiKategori)
      const abnormal = cats.find((d) => d.name === 'Abnormal')
      return abnormal ? ((abnormal.value / totalSkrining) * 100).toFixed(1) : '0'
    }
    return '0'
  }, [dashData, totalSkrining])

  const monthlyData = useMemo(() => {
    if (dashData?.skriningPerBulan) {
      return normalizeMonthlyData(dashData.skriningPerBulan).map((item) => ({
        ...item,
        month: monthLabels[parseInt(item.month.split('-')[1], 10) - 1] || item.month,
      }))
    }
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      months.push({
        month: monthLabels[d.getMonth()],
        count: 0,
      })
    }
    return months
  }, [dashData, currentMonth, currentYear, monthLabels])

  const categoryData = useMemo(() => {
    if (dashData?.distribusiKategori) {
      return normalizeCategories(dashData.distribusiKategori)
    }
    return ['Normal', 'Borderline', 'Abnormal'].map((name) => ({ name, value: 0 }))
  }, [dashData])

  if (loading) return <LoadingSpinner fullPage />

  if (error) {
    return (
      <div>
        <PageHeader
          icon={LayoutDashboard}
          title={t('nav_dashboard')}
          subtitle={t('dashboard_subtitle')}
          gradient
        />
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertTriangle size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('dashboard_error')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title={t('nav_dashboard')}
        subtitle={t('dashboard_subtitle')}
        gradient
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} value={totalPengasuh} label={t('total_pengasuh')} />
        <StatCard icon={ClipboardList} value={totalSkrining} label={t('total_screening')} />
        <StatCard icon={TrendingUp} value={screeningThisMonth} label={t('screening_this_month')} />
        <StatCard icon={AlertTriangle} value={`${percentAbnormal}%`} label={t('percent_abnormal')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h2 className="font-headline-md text-headline-md font-semibold mb-4" style={{ color: '#8B6914' }}>{t('screenings_per_month')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} aria-label={t('screenings_per_month')} role="img">
              <CartesianGrid vertical={false} strokeDasharray="0" stroke="rgba(0,67,73,0.08)" />
              <XAxis dataKey="month" stroke="rgba(0,67,73,0.08)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="rgba(0,67,73,0.08)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#004349" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h2 className="font-headline-md text-headline-md font-semibold mb-4" style={{ color: '#8B6914' }}>{t('category_distribution')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart aria-label={t('category_distribution')} role="img">
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
