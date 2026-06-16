import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { mockSkrining, mockAnak, mockSkala } from '../../../data/mockData'
import * as api from '../../../api/pengasuh'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Info, ClipboardCheck } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { formatDate, getSkalaName } from '../../../lib/utils'

export default function ResultPage() {
  const { t, i18n } = useTranslation()
  const { childId, skriningId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [skrining, setSkrining] = useState(null)
  const [child, setChild] = useState(null)
  const [skalaList, setSkalaList] = useState(mockSkala)

  useEffect(() => {
    let cancelled = false
    async function fetchResult() {
      try {
        const detail = await api.getScreeningDetail(parseInt(skriningId))
        if (detail && !cancelled) {
          setSkrining(detail)
        }
      } catch (err) {
        console.error('Failed to load screening detail:', err)
        const found = mockSkrining.find((s) => s.id === parseInt(skriningId))
        if (found && !cancelled) setSkrining(found)
      }

      try {
        const children = await api.getChildren()
        const foundChild = Array.isArray(children)
          ? children.find((a) => a.id === parseInt(childId))
          : null
        if (foundChild && !cancelled) {
          setChild(foundChild)
        } else {
          const mockChild = mockAnak.find((a) => a.id === parseInt(childId))
          if (mockChild && !cancelled) setChild(mockChild)
        }
      } catch (err) {
        console.error('Failed to load children:', err)
        const mockChild = mockAnak.find((a) => a.id === parseInt(childId))
        if (mockChild && !cancelled) setChild(mockChild)
      }

      try {
        const skala = await api.getSkala()
        if (skala && !cancelled) setSkalaList(skala)
      } catch (err) {
        console.error('Failed to load skala:', err)
        // keep mockSkala fallback
      }
    }
    fetchResult().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [childId, skriningId])

  const getInterpretationKey = () => {
    if (!skrining) return 'interp_normal'
    switch (skrining.kategori_total) {
      case 'Borderline':
        return 'interp_borderline'
      case 'Abnormal':
        return 'interp_abnormal'
      default:
        return 'interp_normal'
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto page-enter">
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (!skrining || !child) {
    return (
      <div className="empty-state page-enter">
        <div className="empty-state-icon">
          <Info size={48} aria-hidden="true" />
        </div>
        <p className="empty-state-text">{t('no_data')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <PageHeader
        icon={ClipboardCheck}
        title={t('screening_result_title')}
        subtitle={`${child.nama} · ${t('screening_date')}: ${formatDate(skrining.tanggal_skrining)}`}
        backTo={`/pengasuh/screening/${childId}`}
        gradient
      />

      <div className="table-container mb-4">
        <table>
          <thead>
            <tr>
              <th className="text-body-md">{t('field_scale')}</th>
              <th className="text-center text-body-md">{t('screening_total_score')}</th>
              <th className="text-right text-body-md">{t('category_distribution')}</th>
            </tr>
          </thead>
          <tbody>
            {skrining.per_skala.map((ps) => (
              <tr key={ps.id_skala}>
                <td className="text-body-md">{getSkalaName(ps.id_skala, skalaList, i18n)}</td>
                <td className="text-center font-medium text-body-md">{ps.skor}</td>
                <td className="text-right">
                  <Badge variant={ps.kategori}>{t(ps.kategori.toLowerCase())}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stat-card mb-4">
        <div>
          <p className="stat-card-label">{t('screening_total_score')}</p>
          <p className="stat-card-value">{skrining.total_score}</p>
        </div>
        <Badge variant={skrining.kategori_total}>{t((skrining.kategori_total || '').toLowerCase())}</Badge>
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-2">
          <Info size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-body-strong mb-1">{t('screening_interpretation')}</h3>
            <p className="text-caption">{t(getInterpretationKey())}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1 justify-center"
          onClick={() => navigate(`/pengasuh/monitoring/${childId}`)}
        >
          {t('screening_see_history')}
        </Button>
        <Button
          className="flex-1 justify-center"
          onClick={() => navigate(`/pengasuh/screening/${childId}`)}
        >
          {t('screening_again')}
        </Button>
      </div>
    </div>
  )
}
