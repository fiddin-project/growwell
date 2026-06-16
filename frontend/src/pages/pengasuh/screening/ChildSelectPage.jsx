import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { mockAnak, mockSkrining } from '../../../data/mockData'
import { calculateAge } from '../../../lib/scoring'
import * as api from '../../../api/pengasuh'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import { Plus, User, User2, CalendarDays, Stethoscope, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/ui/PageHeader'
import SearchBar from '../../../components/ui/SearchBar'
import { formatDate, getCategoryColor } from '../../../lib/utils'

export default function ChildSelectPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [children, setChildren] = useState([])
  const [lastScreenings, setLastScreenings] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nama: '', tanggal_lahir: '', jenis_kelamin: 'L' })
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchChildren() {
      let childrenList = []
      try {
        const data = await api.getChildren()
        if (Array.isArray(data)) {
          childrenList = data
        }
      } catch (err) {
        console.error('Failed to load children:', err)
        childrenList = mockAnak
        toast.error(t('toast_error_api'))
      }

      const screeningsMap = {}
      await Promise.all(
        childrenList.map(async (child) => {
          try {
            const screenings = await api.getScreenings(child.id)
            if (Array.isArray(screenings) && screenings.length > 0) {
              screeningsMap[child.id] = screenings.sort(
                (a, b) => new Date(b.tanggal_skrining) - new Date(a.tanggal_skrining)
              )[0]
            }
          } catch (err) {
            console.error('Failed to load screenings:', err)
            const fallback = mockSkrining
              .filter((s) => s.anak_id === child.id)
              .sort((a, b) => new Date(b.tanggal_skrining) - new Date(a.tanggal_skrining))
            if (fallback[0]) screeningsMap[child.id] = fallback[0]
          }
        })
      )

      if (!cancelled) {
        setChildren(childrenList)
        setLastScreenings(screeningsMap)
      }
    }
    fetchChildren().finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  const filteredChildren = children.filter((child) =>
    !search || child.nama.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({ nama: '', tanggal_lahir: '', jenis_kelamin: 'L' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nama.trim() || !form.tanggal_lahir) {
      toast.error(t('fill_all_fields'))
      return
    }
    setSaveLoading(true)
    try {
      const created = await api.createChild({
        nama: form.nama.trim(),
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        created_by_admin: false,
      })
      setChildren((prev) => [created, ...prev])
      toast.success(t('toast_created'))
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to create child:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.deleteChild(deleteTarget.id)
      setChildren((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch (err) {
      const msg = err?.response?.data?.error || t('toast_error_api')
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="page-enter">
        <PageHeader
          icon={Stethoscope}
          title={t('screening_select_child')}
          subtitle={t('pengasuh_screening_subtitle')}
          action={<Button onClick={openCreate} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
          gradient
        />
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="page-enter">
        <PageHeader
          icon={Stethoscope}
          title={t('screening_select_child')}
          subtitle={t('pengasuh_screening_subtitle')}
          action={<Button onClick={openCreate} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
          gradient
        />
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_children')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader
        icon={Stethoscope}
        title={t('screening_select_child')}
        subtitle={t('pengasuh_screening_subtitle')}
        action={<Button onClick={openCreate} className="shrink-0"><Plus size={20} />{t('screening_new_child')}</Button>}
        gradient
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChildren.map((child) => {
          const age = calculateAge(child.tanggal_lahir)
          const lastScreening = lastScreenings[child.id] || null

          return (
            <div key={child.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-full ${child.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                  {child.jenis_kelamin === 'L' ? <User size={22} aria-hidden="true" /> : <User2 size={22} aria-hidden="true" />}
                </div>
                <div>
                  <h3 className="text-body-strong">{child.nama}</h3>
                  <p className="text-caption">
                    {t('age')}: {age} {t('years')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption mb-4">
                <CalendarDays size={14} aria-hidden="true" />
                <span>
                  {t('screening_last')}:{' '}
                  {lastScreening ? formatDate(lastScreening.tanggal_skrining) : '-'}
                </span>
                {lastScreening && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(lastScreening.kategori_total)}`}>
                    {t((lastScreening.kategori_total || '').toLowerCase())}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1 justify-center"
                  onClick={() => navigate(`/pengasuh/screening/${child.id}`)}
                >
                  {t('screening_start')}
                </button>
                <button
                  className="flex items-center justify-center w-10 rounded-xl border border-outline-variant/40 text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors"
                  onClick={() => setDeleteTarget(child)}
                  aria-label={t('delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('screening_new_child')}
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} loading={saveLoading}>{t('save')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('field_nama_anak')}
              id="nama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <Input
              label={t('field_tanggal_lahir')}
              id="tanggal_lahir"
              type="date"
              value={form.tanggal_lahir}
              onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('field_jenis_kelamin')}</label>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                  form.jenis_kelamin === 'L'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-outline-variant/50 hover:bg-surface-container-low'
                }`}
                onClick={() => setForm({ ...form, jenis_kelamin: 'L' })}
                aria-pressed={form.jenis_kelamin === 'L'}
              >
                <span className="font-label-sm text-label-sm">{t('gender_male')}</span>
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                  form.jenis_kelamin === 'P'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-outline-variant/50 hover:bg-surface-container-low'
                }`}
                onClick={() => setForm({ ...form, jenis_kelamin: 'P' })}
                aria-pressed={form.jenis_kelamin === 'P'}
              >
                <span className="font-label-sm text-label-sm">{t('gender_female')}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete')}
        message={t('confirm_delete')}
        loading={deleteLoading}
      />
    </div>
  )
}
