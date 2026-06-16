import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Ruler, Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import * as api from '../../api/admin'

export default function SkalaPage() {
  const { t } = useTranslation()
  const [skala, setSkala] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ id_skala: '', nama_skala: '', nama_skala_en: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const abortRef = useRef(null)

  const fetchSkala = useCallback(async (searchTerm, pageNum) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const isFirstLoad = skala.length === 0
    isFirstLoad ? setLoading(true) : setSearching(true)
    try {
      const params = { page: pageNum, limit: pageSize }
      if (searchTerm) params.search = searchTerm
      const res = await api.getSkala(params)
      if (!controller.signal.aborted) {
        setSkala(Array.isArray(res) ? res : res.data || [])
      }
    } catch (err) {
      console.error('Failed to load scales:', err)
      if (!controller.signal.aborted) {
        toast.error(t('toast_error_api'))
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setSearching(false)
      }
    }
  }, [t]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSkala(search, page)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchSkala(search, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingItem(null)
    setForm({ id_skala: '', nama_skala: '', nama_skala_en: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ id_skala: item.id_skala, nama_skala: item.nama_skala, nama_skala_en: item.nama_skala_en })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.id_skala.trim() || !form.nama_skala.trim() || !form.nama_skala_en.trim()) {
      toast.error(t('fill_all_fields'))
      return
    }
    setSaveLoading(true)
    try {
      if (editingItem) {
        const updated = await api.updateSkala(editingItem.id_skala, { id_skala: form.id_skala, nama_skala: form.nama_skala, nama_skala_en: form.nama_skala_en })
        setSkala((prev) =>
          prev.map((s) =>
            s.id_skala === editingItem.id_skala
              ? { ...s, ...updated }
              : s
          )
        )
        toast.success(t('toast_updated'))
      } else {
        const created = await api.createSkala({ id_skala: form.id_skala, nama_skala: form.nama_skala, nama_skala_en: form.nama_skala_en })
        setSkala((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save scale:', err)
      if (editingItem) {
        setSkala((prev) =>
          prev.map((s) =>
            s.id_skala === editingItem.id_skala
              ? { ...s, id_skala: form.id_skala, nama_skala: form.nama_skala, nama_skala_en: form.nama_skala_en }
              : s
          )
        )
      } else {
        setSkala((prev) => [...prev, { id_skala: form.id_skala, nama_skala: form.nama_skala, nama_skala_en: form.nama_skala_en }])
      }
      toast.error(t('toast_error_api'))
      setModalOpen(false)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deleteSkala(deleteTarget.id_skala)
      setSkala((prev) => prev.filter((s) => s.id_skala !== deleteTarget.id_skala))
      toast.success(t('toast_deleted'))
    } catch (err) {
      console.error('Failed to delete scale:', err)
      setSkala((prev) => prev.filter((s) => s.id_skala !== deleteTarget.id_skala))
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      accessor: 'id_skala',
      header: t('field_id_skala'),
    },
    {
      accessor: 'nama_skala',
      header: t('field_nama_skala'),
    },
    {
      accessor: 'nama_skala_en',
      header: t('field_nama_skala_en'),
    },
  ]

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <PageHeader
        icon={Ruler}
        title={t('nav_skala')}
        subtitle={t('skala_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch} />

      <DataTable
        serverMode
        data={skala}
        columns={columns}
        rowKey="id_skala"
        loading={searching}
        emptyMessage={t('empty_skala_title')}
        emptyIcon={Ruler}
        actions={(item) => (
          <>
            <button onClick={() => openEdit(item)} className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title={t('edit')} aria-label={t('edit')}>
              <Edit size={18} />
            </button>
            <button onClick={() => setDeleteTarget(item)} className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors" title={t('delete')} aria-label={t('delete')}>
              <Trash2 size={18} />
            </button>
          </>
        )}
      />

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
              label={t('field_id_skala')}
              id="id_skala"
              value={form.id_skala}
              onChange={(e) => setForm({ ...form, id_skala: e.target.value })}
            />
            <Input
              label={t('field_nama_skala')}
              id="nama_skala"
              value={form.nama_skala}
              onChange={(e) => setForm({ ...form, nama_skala: e.target.value })}
            />
          </div>
          <Input
            label={t('field_nama_skala_en')}
            id="nama_skala_en"
            value={form.nama_skala_en}
            onChange={(e) => setForm({ ...form, nama_skala_en: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm_delete_title')}
        message={deleteTarget ? t('confirm_delete_user', { name: deleteTarget.nama_skala }) : t('confirm_delete')}
        loading={deleteLoading}
      />
    </>
  )
}
