import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Save, RotateCcw, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import * as api from '../../api/admin'
import { mockAmbangBatas, mockSkala } from '../../data/mockData'

const defaultAmbangBatas = [...mockAmbangBatas]

export default function AmbangBatasPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(() => mockAmbangBatas.map((item) => ({ ...item })))
  const [skalaList, setSkalaList] = useState(mockSkala)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    api.getAmbangBatas()
      .then((res) => setData(res))
      .catch(() => { toast.error(t('toast_error_api')) })
      .finally(() => setLoading(false))

    api.getSkala()
      .then((res) => setSkalaList(res))
      .catch(() => {})
  }, [t])

  const handleInputChange = (id, field, value) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: Number(value) } : item))
    )
  }

  const handleSave = async () => {
    for (const item of data) {
      if (item.batas_normal_max >= item.batas_borderline_max) {
        toast.error(t('threshold_validation'))
        return
      }
    }
    setSaving(true)
    try {
      await Promise.all(
        data.map((item) =>
          api.updateAmbangBatas(item.id, {
            batas_normal_max: item.batas_normal_max,
            batas_borderline_max: item.batas_borderline_max,
          })
        )
      )
      toast.success(t('toast_saved'))
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save thresholds:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setResetConfirmOpen(false)
    setResetting(true)
    try {
      const res = await api.resetAmbangBatas()
      setData(res)
      toast.success(t('toast_reset'))
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to reset thresholds:', err)
      setData(defaultAmbangBatas.map((item) => ({ ...item })))
      toast.error(t('toast_error_api'))
    } finally {
      setResetting(false)
    }
  }

  const scaleLookup = (id_skala) => {
    if (!id_skala) return t('total')
    const s = skalaList.find((sc) => sc.id_skala === id_skala)
    return s ? `${s.nama_skala} / ${s.nama_skala_en} (${s.id_skala})` : id_skala
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title={t('nav_thresholds')}
        subtitle={t('ambang_subtitle')}
        gradient
        action={<div className="flex gap-3">{!isEditing ? (<button onClick={() => setIsEditing(true)} className="btn-primary-pill"><Edit size={20} /><span className="font-label-md text-label-md">{t('edit')}</span></button>) : (<><button onClick={handleSave} disabled={saving} className="btn-primary-pill"><Save size={20} /><span className="font-label-md text-label-md">{t('save_changes')}</span></button><button onClick={() => { setIsEditing(false); api.getAmbangBatas().then((res) => setData(res)).catch(() => toast.error(t('toast_error_api'))) }} className="flex items-center gap-2 border border-outline-variant/50 text-on-surface px-6 py-3 rounded-full hover:bg-surface-container-low transition-colors duration-200"><RotateCcw size={20} /><span className="font-label-md text-label-md">{t('cancel')}</span></button><button onClick={() => setResetConfirmOpen(true)} disabled={resetting} className="flex items-center gap-2 border border-outline-variant/50 text-on-surface px-6 py-3 rounded-full hover:bg-surface-container-low transition-colors duration-200 disabled:opacity-50"><RotateCcw size={20} /><span className="font-label-md text-label-md">{t('reset_defaults')}</span></button></>)}</div>}
      />

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(13,92,99,0.05)] border border-outline-variant/20 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">{t('nav_thresholds')}</caption>
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">{t('field_scale')}</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">{t('field_batas_normal')}</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">{t('field_batas_borderline')}</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">{t('field_is_reversed')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-body-sm text-body-sm text-on-surface">
                    {scaleLookup(item.id_skala)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      className={`w-24 border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface transition-colors outline-none ${isEditing ? 'bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary' : 'bg-surface-container-low/50 text-on-surface-variant cursor-not-allowed'}`}
                      value={item.batas_normal_max}
                      onChange={(e) => handleInputChange(item.id, 'batas_normal_max', e.target.value)}
                      disabled={!isEditing}
                      aria-label={`${t('field_batas_normal')} ${scaleLookup(item.id_skala)}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      className={`w-24 border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface transition-colors outline-none ${isEditing ? 'bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary' : 'bg-surface-container-low/50 text-on-surface-variant cursor-not-allowed'}`}
                      value={item.batas_borderline_max}
                      onChange={(e) => handleInputChange(item.id, 'batas_borderline_max', e.target.value)}
                      disabled={!isEditing}
                      aria-label={`${t('field_batas_borderline')} ${scaleLookup(item.id_skala)}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-label-sm font-label-sm leading-5 rounded-full ${
                      item.is_reversed
                        ? 'bg-error/10 text-error'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {item.is_reversed ? t('true_val') : t('false_val')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleReset}
        title={t('reset_defaults')}
        message={t('confirm_reset')}
        confirmLabel={t('reset_defaults')}
        loading={resetting}
      />
    </>
  )
}
