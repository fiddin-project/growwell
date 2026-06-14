import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useCrud({ api, setItems, validate, getId = (item) => item.id, getDisplayName = (item) => item.nama }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const openCreate = useCallback((defaultForm = {}) => {
    setEditingItem(null)
    setForm(defaultForm)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item, mapToForm) => {
    setEditingItem(item)
    setForm(mapToForm ? mapToForm(item) : { ...item })
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async (t) => {
    if (validate && !validate(form, editingItem)) {
      toast.error(t('fill_all_questions'))
      return
    }
    setSaveLoading(true)
    try {
      if (editingItem) {
        const updated = await api.update(getId(editingItem), form)
        setItems((prev) => prev.map((item) => (getId(item) === getId(editingItem) ? { ...item, ...updated } : item)))
        toast.success(t('toast_updated'))
      } else {
        const created = await api.create(form)
        setItems((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch {
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }, [api, editingItem, form, setItems, validate, getId])

  const handleDelete = useCallback(async (t) => {
    setDeleteLoading(true)
    try {
      await api.delete(getId(deleteTarget))
      setItems((prev) => prev.filter((item) => getId(item) !== getId(deleteTarget)))
      toast.success(t('toast_deleted'))
    } catch {
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }, [api, deleteTarget, setItems, getId])

  return {
    modalOpen, setModalOpen,
    editingItem, setEditingItem,
    form, setForm,
    deleteTarget, setDeleteTarget,
    deleteLoading,
    saveLoading,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  }
}
