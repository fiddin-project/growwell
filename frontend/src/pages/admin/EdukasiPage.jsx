import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2, FileText, Video, BookOpen, ExternalLink, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import * as api from '../../api/admin'
import { mockEdukasi } from '../../data/mockData'

const FILTERS = [
  { key: 'all', label: 'edu_filter_all' },
  { key: 'pdf', label: 'type_pdf' },
  { key: 'youtube', label: 'type_youtube' },
]

export default function EdukasiPage() {
  const { t, i18n } = useTranslation()
  const [edukasi, setEdukasi] = useState(() => [...mockEdukasi])
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    judul: '', judul_en: '', deskripsi: '', deskripsi_en: '', tipe: 'pdf', url_atau_file: '', is_active: true,
  })
  const [file, setFile] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    api.getEdukasi()
      .then((res) => setEdukasi(res))
      .catch(() => { toast.error(t('toast_error_api')) })
      .finally(() => setLoading(false))
  }, [t])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ judul: '', judul_en: '', deskripsi: '', deskripsi_en: '', tipe: 'pdf', url_atau_file: '', is_active: true })
    setFile(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      judul: item.judul, judul_en: item.judul_en, deskripsi: item.deskripsi,
      deskripsi_en: item.deskripsi_en, tipe: item.tipe, url_atau_file: item.url_atau_file,
      is_active: item.is_active,
    })
    setFile(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.judul.trim() || !form.judul_en.trim() || !form.deskripsi.trim() || !form.deskripsi_en.trim() || !form.tipe) {
      toast.error(t('fill_all_fields'))
      return
    }
    if (form.tipe === 'pdf' && !editingItem && !file) {
      toast.error(t('pdf_file_required'))
      return
    }
    if (form.tipe === 'pdf' && editingItem?.tipe !== 'pdf' && !file) {
      toast.error(t('pdf_file_required'))
      return
    }
    if (form.tipe === 'youtube' && !/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(form.url_atau_file.trim())) {
      toast.error(t('youtube_url_invalid'))
      return
    }
    setSaveLoading(true)
    try {
      const fd = new FormData()
      fd.append('judul', form.judul)
      fd.append('judul_en', form.judul_en)
      fd.append('deskripsi', form.deskripsi)
      fd.append('deskripsi_en', form.deskripsi_en)
      fd.append('tipe', form.tipe)
      fd.append('is_active', form.is_active)
      if (form.tipe === 'youtube') {
        fd.append('url_atau_file', form.url_atau_file)
      } else if (file) {
        fd.append('file', file)
      }

      if (editingItem) {
        const updated = await api.updateEdukasi(editingItem.id, fd)
        setEdukasi((prev) =>
          prev.map((e) => (e.id === editingItem.id ? { ...e, ...updated } : e))
        )
        toast.success(t('toast_updated'))
      } else {
        const created = await api.createEdukasi(fd)
        setEdukasi((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save education:', err)
      toast.error(err.response?.data?.error || t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deleteEdukasi(deleteTarget.id)
      setEdukasi((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch (err) {
      console.error('Failed to delete education:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const handleOpenLink = (item) => {
    window.open(item.url_atau_file, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <LoadingSpinner fullPage />

  const filteredEdukasi = edukasi.filter((e) => {
    const matchFilter = filter === 'all' || e.tipe === filter
    const matchSearch = !search || e.judul.toLowerCase().includes(search.toLowerCase()) || e.judul_en.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && e.is_active) || (statusFilter === 'inactive' && !e.is_active)
    return matchFilter && matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title={t('nav_education')}
        subtitle={t('edukasi_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch}>
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                filter === f.key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="font-label-sm text-label-sm">{t(f.label)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[{ key: 'all', label: t('edu_filter_all') }, { key: 'active', label: t('status_active') }, { key: 'inactive', label: t('status_inactive') }].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-on-surface ${
                statusFilter === s.key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <span className="font-label-sm text-label-sm">{s.label}</span>
            </button>
          ))}
        </div>
      </SearchBar>

      {filteredEdukasi.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEdukasi.map((item) => (
            <div key={item.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {item.tipe === 'pdf' ? (
                    <FileText size={20} className="text-primary" aria-hidden="true" />
                  ) : (
                    <Video size={20} className="text-primary" aria-hidden="true" />
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.tipe === 'pdf'
                      ? 'badge-info'
                      : 'badge-error'
                  }`}>
                    {item.tipe === 'pdf' ? t('type_pdf') : t('type_youtube')}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.is_active
                      ? 'badge-success'
                      : 'badge-neutral'
                  }`}>
                    {item.is_active ? t('status_active') : t('status_inactive')}
                  </span>
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
              <h3 className="text-body-strong mb-2 line-clamp-2" title={item.judul}>{item.judul}</h3>
              <p className="text-caption mb-4 flex-1 line-clamp-3" title={item.deskripsi}>{i18n.language?.startsWith('id') ? item.deskripsi : item.deskripsi_en}</p>
              {item.tipe === 'pdf' ? (
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => handleOpenLink(item)}
                >
                  <FileText size={16} aria-hidden="true" />
                  {t('edu_open_pdf')}
                </button>
              ) : (
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => handleOpenLink(item)}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {t('edu_watch')}
                </button>
              )}
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
              label={t('field_judul')}
              id="judul"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
            />
            <Input
              label={t('field_judul_en')}
              id="judul_en"
              value={form.judul_en}
              onChange={(e) => setForm({ ...form, judul_en: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('field_deskripsi')}
              id="deskripsi"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
            <Input
              label={t('field_deskripsi_en')}
              id="deskripsi_en"
              value={form.deskripsi_en}
              onChange={(e) => setForm({ ...form, deskripsi_en: e.target.value })}
            />
          </div>
          <div className="w-full max-w-xs">
            <Select
              label={t('field_tipe')}
              id="tipe"
              value={form.tipe}
              onChange={(e) => { setForm({ ...form, tipe: e.target.value, url_atau_file: '' }); setFile(null) }}
            >
              <option value="pdf">{t('type_pdf')}</option>
              <option value="youtube">{t('type_youtube')}</option>
            </Select>
          </div>
          {form.tipe === 'youtube' ? (
            <Input
              label={t('field_url')}
              id="url"
              value={form.url_atau_file}
              onChange={(e) => setForm({ ...form, url_atau_file: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          ) : (
            <Input
              label={t('field_url')}
              id="file"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  if (f.type !== 'application/pdf' || !f.name.toLowerCase().endsWith('.pdf')) {
                    toast.error(t('pdf_file_invalid'))
                    e.target.value = ''
                    return
                  }
                  if (f.size > 10 * 1024 * 1024) {
                    toast.error(t('file_too_large'))
                    e.target.value = ''
                    return
                  }
                  setFile(f)
                  setForm({ ...form, url_atau_file: f.name })
                }
              }}
            />
          )}
          <Select
            label={t('field_status')}
            id="is_active"
            value={form.is_active ? 'active' : 'inactive'}
            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
          >
            <option value="active">{t('status_active')}</option>
            <option value="inactive">{t('status_inactive')}</option>
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm_delete_title')}
        message={t('confirm_delete')}
        loading={deleteLoading}
      />
    </div>
  )
}
