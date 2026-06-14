import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { mockAnak as initialMockAnak } from '../../../data/mockData'
import * as api from '../../../api/pengasuh'
import { UserPlus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/ui/PageHeader'

export default function NewChildPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [anakList, setAnakList] = useState(initialMockAnak)
  const [nama, setNama] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState('L')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nama.trim() || !tanggalLahir) {
      toast.error(t('fill_all_questions'))
      return
    }
    setLoading(true)

    const newChildData = {
      nama: nama.trim(),
      tanggal_lahir: tanggalLahir,
      jenis_kelamin: jenisKelamin,
      created_by_admin: false,
    }

    try {
      const created = await api.createChild(newChildData)
      toast.success(t('screening_new_child'))
      navigate(`/pengasuh/screening/${created.id}`)
    } catch {
      toast.error(t('toast_error_api'))
      navigate('/pengasuh/screening')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto page-enter py-8">
      <PageHeader
        icon={UserPlus}
        title={t('screening_new_child')}
        subtitle={t('pengasuh_new_child_subtitle')}
        backTo="/pengasuh/screening"
        gradient
      />

      <form onSubmit={handleSubmit} className="card shadow-sm border border-outline-variant/20 p-6 md:p-8 space-y-6">
        <Input
          label={t('field_nama_lengkap')}
          id="child-nama"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder={t('field_nama_lengkap')}
          required
        />

        <Input
          label={t('field_tanggal_lahir')}
          id="child-dob"
          type="date"
          value={tanggalLahir}
          onChange={(e) => setTanggalLahir(e.target.value)}
          required
        />

        <div>
          <label className="block font-label-md text-label-md font-semibold text-on-surface-variant mb-3">{t('field_jenis_kelamin')}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                jenisKelamin === 'L'
                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low text-on-surface-variant'
              }`}
              onClick={() => setJenisKelamin('L')}
              aria-pressed={jenisKelamin === 'L'}
            >
              <span className="material-symbols-outlined text-lg">male</span>
              <span className="font-label-md text-label-md">{t('gender_male')}</span>
            </button>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                jenisKelamin === 'P'
                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low text-on-surface-variant'
              }`}
              onClick={() => setJenisKelamin('P')}
              aria-pressed={jenisKelamin === 'P'}
            >
              <span className="material-symbols-outlined text-lg">female</span>
              <span className="font-label-md text-label-md">{t('gender_female')}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-outline-variant/20 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/pengasuh/screening')}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant font-semibold hover:bg-surface-container-low transition-colors"
          >
            {t('cancel')}
          </button>
          <Button type="submit" className="flex-1 justify-center" disabled={loading} loading={loading}>
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
