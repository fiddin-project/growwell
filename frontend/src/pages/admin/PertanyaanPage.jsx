import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpCircle, Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import * as api from '../../api/admin'
import { mockPertanyaan, mockSkala } from '../../data/mockData'

export default function PertanyaanPage() {
  const { t, i18n } = useTranslation()
  const [pertanyaan, setPertanyaan] = useState(() => [...mockPertanyaan])
  const [scales, setScales] = useState(() => [...mockSkala])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({
    urutan: 0, teks_pertanyaan: '', teks_pertanyaan_en: '', id_skala: '',
    skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2,
  })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [filterScale, setFilterScale] = useState('')

  useEffect(() => {
    Promise.all([
      api.getPertanyaan().then(setPertanyaan).catch(() => { toast.error(t('toast_error_api')) }),
      api.getSkala().then(setScales).catch(() => { toast.error(t('toast_error_api')) }),
    ]).finally(() => setLoading(false))
  }, [t])

  const openCreate = () => {
    setEditingItem(null)
    setForm({
      urutan: 0, teks_pertanyaan: '', teks_pertanyaan_en: '', id_skala: '',
      skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2,
    })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      urutan: item.urutan || 0,
      teks_pertanyaan: item.teks_pertanyaan,
      teks_pertanyaan_en: item.teks_pertanyaan_en,
      id_skala: item.id_skala,
      skor_tidak_benar: item.skor_tidak_benar,
      skor_agak_benar: item.skor_agak_benar,
      skor_selalu_benar: item.skor_selalu_benar,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.teks_pertanyaan.trim() || !form.id_skala) {
      toast.error(t('fill_all_questions'))
      return
    }
    setSaveLoading(true)
    try {
      if (editingItem) {
        const updated = await api.updatePertanyaan(editingItem.id, form)
        setPertanyaan((prev) =>
          prev.map((p) =>
            p.id === editingItem.id ? { ...p, ...updated } : p
          )
        )
        toast.success(t('toast_updated'))
      } else {
        const created = await api.createPertanyaan(form)
        setPertanyaan((prev) => [...prev, created])
        toast.success(t('toast_created'))
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save question:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await api.deletePertanyaan(deleteTarget.id)
      setPertanyaan((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success(t('toast_deleted'))
    } catch (err) {
      console.error('Failed to delete question:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const getScaleName = (id_skala) => {
    const scale = scales.find((s) => s.id_skala === id_skala)
    if (!scale) return id_skala
    return i18n.language === 'id' ? scale.nama_skala : scale.nama_skala_en
  }

  const filteredData = pertanyaan.filter((p) => {
    const matchesScale = filterScale ? p.id_skala === filterScale : true
    return matchesScale
  })

  const columns = [
    {
      accessor: null,
      header: 'No.',
      sortable: false,
      render: (_row, idx) => idx + 1,
      hideOnMobile: true,
    },
    {
      accessor: 'teks_pertanyaan',
      header: t('field_question'),
    },
    {
      accessor: 'teks_pertanyaan_en',
      header: t('field_question_en'),
      hideOnMobile: true,
    },
    {
      accessor: 'id_skala',
      header: t('field_scale'),
      render: (item) => getScaleName(item.id_skala),
    },
    {
      accessor: 'skor_tidak_benar',
      header: 'TT',
      render: (item) => <span className="text-center block">{item.skor_tidak_benar}</span>,
      hideOnMobile: true,
    },
    {
      accessor: 'skor_agak_benar',
      header: 'AB',
      render: (item) => <span className="text-center block">{item.skor_agak_benar}</span>,
      hideOnMobile: true,
    },
    {
      accessor: 'skor_selalu_benar',
      header: 'SB',
      render: (item) => <span className="text-center block">{item.skor_selalu_benar}</span>,
      hideOnMobile: true,
    },
  ]

  if (loading) return <LoadingSpinner fullPage />

  return (
    <>
      <PageHeader
        icon={HelpCircle}
        title={t('nav_questions')}
        subtitle={t('pertanyaan_subtitle')}
        gradient
        action={<button onClick={openCreate} className="btn-primary-pill"><Plus size={20} /><span className="font-label-md text-label-md">{t('add_new')}</span></button>}
      />

      <DataTable
        data={filteredData}
        columns={columns}
        emptyMessage={t('empty_pertanyaan_title')}
        emptyIcon={HelpCircle}
        headerRight={
          <div className="w-full md:w-auto">
            <Select
              id="filter-scale"
              value={filterScale}
              onChange={(e) => setFilterScale(e.target.value)}
            >
              <option value="">{t('edu_filter_all')}</option>
              {scales.map((s) => (
                <option key={s.id_skala} value={s.id_skala}>{i18n.language === 'id' ? s.nama_skala : s.nama_skala_en} ({s.id_skala})</option>
              ))}
            </Select>
          </div>
        }
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
          <Input
            label={t('field_urutan')}
            id="urutan"
            type="number"
            inputMode="numeric"
            value={form.urutan}
            onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
          />
          <Input
            label={t('field_question')}
            id="teks_pertanyaan"
            value={form.teks_pertanyaan}
            onChange={(e) => setForm({ ...form, teks_pertanyaan: e.target.value })}
          />
          <Input
            label={t('field_question_en')}
            id="teks_pertanyaan_en"
            value={form.teks_pertanyaan_en}
            onChange={(e) => setForm({ ...form, teks_pertanyaan_en: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('field_scale')}
              id="id_skala"
              value={form.id_skala}
              onChange={(e) => setForm({ ...form, id_skala: e.target.value })}
            >
              <option value="">-- {t('field_scale')} --</option>
              {scales.map((s) => (
                <option key={s.id_skala} value={s.id_skala}>{s.nama_skala} ({s.id_skala})</option>
              ))}
            </Select>
            <div />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('field_score_not_true')}
              id="skor_tidak_benar"
              type="number"
              inputMode="numeric"
              value={form.skor_tidak_benar}
              onChange={(e) => setForm({ ...form, skor_tidak_benar: Number(e.target.value) })}
            />
            <Input
              label={t('field_score_somewhat')}
              id="skor_agak_benar"
              type="number"
              inputMode="numeric"
              value={form.skor_agak_benar}
              onChange={(e) => setForm({ ...form, skor_agak_benar: Number(e.target.value) })}
            />
            <Input
              label={t('field_score_certainly')}
              id="skor_selalu_benar"
              type="number"
              inputMode="numeric"
              value={form.skor_selalu_benar}
              onChange={(e) => setForm({ ...form, skor_selalu_benar: Number(e.target.value) })}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('confirm_delete_title')}
        message={deleteTarget ? t('confirm_delete_user', { name: deleteTarget.teks_pertanyaan?.substring(0, 50) }) : t('confirm_delete')}
        loading={deleteLoading}
      />
    </>
  )
}
