import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2, MessageCircle, Heart, Plus, Stethoscope } from 'lucide-react'
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
import { mockPsikolog } from '../../data/mockData'

export default function PsikologPage() {
  const { t, i18n } = useTranslation()
  const [psikolog, setPsikolog] = useState(() => [...mockPsikolog])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    nama: '', spesialisasi: '', spesialisasi_en: '', nomor_whatsapp: '', pesan_default: '', pesan_default_en: '', is_active: true,
  })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    api.getPsikolog()
      .then((res) => setPsikolog(res))
      .catch(() => { toast.error(t('toast_error_api')) })
      .finally(() => setLoading(false))
  }, [t])

  const openCreate = () => {
    setEditingItem(null)
    setForm({ nama: '', spesialisasi: '', spesialisasi_en: '', nomor_whatsapp: '', pesan_default: '', pesan_default_en: '', is_active: true })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      nama: item.nama, spesialisasi: item.spesialisasi, spesialisasi_en: item.spesialisasi_en,
      nomor_whatsapp: item.nomor_whatsapp, pesan_default: item.pesan_default, pesan_default_en: item.pesan_default_en,
      is_active: item.is_active,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nama.trim() || !form.nomor_whatsapp.trim()) {
      toast.error(t('fill_all_fields'))
      return
    }
    setSaveLoading(true)
    try {
      if (editingItem) {
        const updated = await api.updatePsikolog(editingItem.id, form)
        setPsikolog((prev) =>
          prev.map((p) => (p.id === editingItem.id ? { ...p, ...updated } : p))
        )
        toast.success(t('toast_updated'))
      } else {
        const created = await api.createPsikolog(form)
        setPsikolog((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch {
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deletePsikolog(deleteTarget.id)
      setPsikolog((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch {
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  const filteredPsikolog = psikolog.filter((p) => {
    const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.spesialisasi.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && p.is_active) || (statusFilter === 'inactive' && !p.is_active)
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader
        icon={Stethoscope}
        title={t('nav_psychologist')}
        subtitle={t('psikolog_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch}>
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

      {filteredPsikolog.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Heart size={48} aria-hidden="true" />
          </div>
          <p className="empty-state-text">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPsikolog.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body-strong text-ink">{item.nama}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.is_active
                        ? 'badge-success'
                        : 'badge-neutral'
                    }`}>
                      {item.is_active ? t('status_active') : t('status_inactive')}
                    </span>
                  </div>
                   <p className="text-caption">{i18n.language?.startsWith('id') ? item.spesialisasi : item.spesialisasi_en}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button className="btn-icon" onClick={() => openEdit(item)} aria-label={t('edit')}>
                    <Edit size={16} aria-hidden="true" />
                  </button>
                  <button className="btn-icon" onClick={() => setDeleteTarget(item)} aria-label={t('delete')}>
                    <Trash2 size={16} aria-hidden="true" className="text-danger" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption mb-3">
                <MessageCircle size={14} className="text-success" aria-hidden="true" />
                <span>+{item.nomor_whatsapp}</span>
              </div>
              <p className="text-caption line-clamp-2" title={item.pesan_default}>{item.pesan_default}</p>
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
          <Input
            label={t('field_nama_lengkap')}
            id="nama"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('field_spesialisasi')}
              id="spesialisasi"
              value={form.spesialisasi}
              onChange={(e) => setForm({ ...form, spesialisasi: e.target.value })}
            />
            <Input
              label={t('field_spesialisasi_en')}
              id="spesialisasi_en"
              value={form.spesialisasi_en}
              onChange={(e) => setForm({ ...form, spesialisasi_en: e.target.value })}
            />
          </div>
          <Input
            label={t('field_whatsapp')}
            id="nomor_whatsapp"
            value={form.nomor_whatsapp}
            onChange={(e) => setForm({ ...form, nomor_whatsapp: e.target.value })}
            placeholder="628123456789"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('field_pesan_default')}
              id="pesan_default"
              value={form.pesan_default}
              onChange={(e) => setForm({ ...form, pesan_default: e.target.value })}
            />
            <Input
              label={t('field_pesan_default_en')}
              id="pesan_default_en"
              value={form.pesan_default_en}
              onChange={(e) => setForm({ ...form, pesan_default_en: e.target.value })}
            />
          </div>
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
