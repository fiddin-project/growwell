import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, UserX, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import { formatDateLocale } from '../../lib/utils'
import * as api from '../../api/admin'

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ nama_lengkap: '', username: '', password: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const abortRef = useRef(null)

  const fetchUsers = useCallback(async (searchTerm, pageNum) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const isFirstLoad = users.length === 0
    isFirstLoad ? setLoading(true) : setSearching(true)
    try {
      const params = { page: pageNum, limit: pageSize }
      if (searchTerm) params.search = searchTerm
        const res = await api.getUsers(params)
        if (!controller.signal.aborted) {
          setUsers(Array.isArray(res) ? res : res.data || [])
        }
    } catch (err) {
      console.error('Failed to load users:', err)
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
    // Initial network synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers(search, page)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsers(search, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditingUser(null)
    setForm({ nama_lengkap: '', username: '', password: '' })
    setModalOpen(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ nama_lengkap: user.nama_lengkap, username: user.username, password: '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nama_lengkap.trim() || !form.username.trim() || (!editingUser && !form.password)) {
      toast.error(t('fill_all_fields'))
      return
    }
    setSaveLoading(true)
    try {
      if (editingUser) {
        const updated = await api.updateUser(editingUser.id, { nama_lengkap: form.nama_lengkap, username: form.username })
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)))
        toast.success(t('toast_updated'))
      } else {
        await api.createUser({ nama_lengkap: form.nama_lengkap, username: form.username, password: form.password })
        toast.success(t('toast_created'))
        fetchUsers(search, page)
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save user:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deleteUser(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const formatDate = (dateStr) => formatDateLocale(dateStr, i18n.language === 'id' ? 'id-ID' : 'en-US')

  const columns = [
    {
      accessor: 'nama_lengkap',
      header: t('column_full_name'),
      render: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary font-bold overflow-hidden border border-secondary/10">
            <span className="font-headline-md">{user.nama_lengkap?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="ml-4">
            <div className="font-body-sm text-body-sm text-on-surface">{user.nama_lengkap}</div>
          </div>
        </div>
      ),
    },
    {
      accessor: 'username',
      header: t('column_username'),
    },
    {
      accessor: 'created_at',
      header: t('column_registration_date'),
      render: (user) => formatDate(user.created_at),
      hideOnMobile: true,
    },
  ]

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <PageHeader
        icon={Users}
        title={t('nav_users')}
        subtitle={t('users_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <SearchBar value={search} onChange={setSearch} onClear={setSearch} />

      <DataTable
        serverMode
        data={users}
        columns={columns}
        loading={searching}
        emptyMessage={t('empty_users_title')}
        emptyIcon={UserX}
        actions={(user) => (
          <>
            <button onClick={() => openEdit(user)} className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title={t('edit')} aria-label={t('edit')}>
              <Edit size={18} />
            </button>
            <button onClick={() => setDeleteTarget(user)} className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors" title={t('delete')} aria-label={t('delete')}>
              <Trash2 size={18} />
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? t('edit') : t('add_new')}
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} loading={saveLoading}>{t('save')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('field_nama_lengkap')}
              id="nama_lengkap"
              value={form.nama_lengkap}
              onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            />
            <Input
              label={t('field_username')}
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          {!editingUser && (
            <div className="relative">
              <Input
                label={t('field_password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t('show_password')}
              >
                <span className="material-symbols-outlined text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm_delete_title')}
        message={deleteTarget ? t('confirm_delete_user', { name: deleteTarget.nama_lengkap }) : t('confirm_delete')}
        loading={deleteLoading}
      />
    </>
  )
}
