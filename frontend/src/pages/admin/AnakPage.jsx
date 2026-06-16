import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Baby, Plus, Edit, Trash2, User, User2, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import { formatDateLocale } from '../../lib/utils'
import * as api from '../../api/admin'
import { mockAnak, mockUsers } from '../../data/mockData'
import { calculateAge } from '../../lib/scoring'

const GENDER_FILTERS = [
  { key: '', label: 'edu_filter_all' },
  { key: 'L', label: 'gender_male' },
  { key: 'P', label: 'gender_female' },
]

export default function AnakPage() {
  const { t, i18n } = useTranslation()
  const [anak, setAnak] = useState(() => [...mockAnak])
  const [userList, setUserList] = useState(() => [...mockUsers])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ nama: '', tanggal_lahir: '', jenis_kelamin: 'L' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getAnak().then(setAnak).catch(() => { toast.error(t('toast_error_api')) }),
      api.getUsers().then((res) => setUserList(Array.isArray(res) ? res : res.data || [])).catch(() => { toast.error(t('toast_error_api')) }),
    ]).finally(() => setLoading(false))
  }, [t])

  const getCreatorName = (createdBy) => {
    if (!createdBy) return '-'
    const user = userList.find((u) => u.id === createdBy)
    return user ? user.nama_lengkap : '-'
  }

  const openCreate = () => {
    setEditingItem(null)
    setForm({ nama: '', tanggal_lahir: '', jenis_kelamin: 'L' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      nama: item.nama,
      tanggal_lahir: String(item.tanggal_lahir).substring(0, 10),
      jenis_kelamin: item.jenis_kelamin,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nama.trim() || !form.tanggal_lahir) {
      toast.error(t('fill_all_fields'))
      return
    }
    setSaveLoading(true)
    try {
      const payload = { nama: form.nama, tanggal_lahir: form.tanggal_lahir, jenis_kelamin: form.jenis_kelamin }
      if (editingItem) {
        const updated = await api.updateAnak(editingItem.id, payload)
        setAnak((prev) =>
          prev.map((a) =>
            a.id === editingItem.id ? { ...a, ...updated } : a
          )
        )
        toast.success(t('toast_updated'))
      } else {
        const created = await api.createAnak(payload)
        setAnak((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save child:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deleteAnak(deleteTarget.id)
      setAnak((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch (err) {
      console.error('Failed to delete child:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const formatDate = (dateStr) => formatDateLocale(dateStr, i18n.language === 'id' ? 'id-ID' : 'en-US')

  const filteredData = anak.filter((a) => {
    const matchesSearch = !search || a.nama.toLowerCase().includes(search.toLowerCase())
    const matchesGender = filterGender ? a.jenis_kelamin === filterGender : true
    return matchesSearch && matchesGender
  })

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <PageHeader
        icon={Baby}
        title={t('nav_children')}
        subtitle={t('anak_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch}>
        <div className="flex gap-2 overflow-x-auto">
          {GENDER_FILTERS.map((g) => (
            <button
              key={g.key}
              onClick={() => setFilterGender(g.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                filterGender === g.key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="font-label-sm text-label-sm">{t(g.label)}</span>
            </button>
          ))}
        </div>
      </SearchBar>

      {filteredData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Baby size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div key={item.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full ${item.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                    {item.jenis_kelamin === 'L' ? <User size={22} aria-hidden="true" /> : <User2 size={22} aria-hidden="true" />}
                  </div>
                  <div>
                    <h3 className="text-body-strong">{item.nama}</h3>
                    <p className="text-caption">
                      {t('age')}: {calculateAge(item.tanggal_lahir)} {t('years')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button className="btn-icon" onClick={() => openEdit(item)} aria-label={t('edit')}>
                    <Edit size={16} aria-hidden="true" />
                  </button>
                  <button className="btn-icon" onClick={() => setDeleteTarget(item)} aria-label={t('delete')}>
                    <Trash2 size={16} aria-hidden="true" className="text-danger" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption mb-2">
                <CalendarDays size={14} aria-hidden="true" />
                <span>{formatDate(item.tanggal_lahir)}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  item.jenis_kelamin === 'L'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-pink-100 text-pink-700'
                }`}>
                  {item.jenis_kelamin === 'L' ? t('gender_male') : t('gender_female')}
                </span>
              </div>
              <p className="text-caption text-fine-print">{t('field_created_by')}: {getCreatorName(item.created_by)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? t('edit') : t('add_new')}
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
        title={t('confirm_delete_title')}
        message={deleteTarget ? t('confirm_delete_user', { name: deleteTarget.nama }) : t('confirm_delete')}
        loading={deleteLoading}
      />
    </div>
  )
}
