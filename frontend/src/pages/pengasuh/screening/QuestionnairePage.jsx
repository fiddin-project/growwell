import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { calculateAge } from '../../../lib/scoring'
import * as api from '../../../api/pengasuh'
import Button from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../../components/ui/PageHeader'

const ANSWER_LABELS = ['tidak_benar', 'agak_benar', 'selalu_benar']
const ANSWER_KEYS = ['answer_not_true', 'answer_somewhat_true', 'answer_certainly_true']

export default function QuestionnairePage() {
  const { t, i18n } = useTranslation()
  const { childId } = useParams()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [instrumentRevision, setInstrumentRevision] = useState(null)
  const [children, setChildren] = useState([])
  const [childLoading, setChildLoading] = useState(true)
  const submissionIdRef = useRef(null)

  const child = useMemo(() => {
    const fromApi = children.find((a) => a.id === parseInt(childId))
    if (fromApi) return fromApi
    return null
  }, [childId, children])

  const age = child ? calculateAge(child.tanggal_lahir) : 0

  useEffect(() => {
    let cancelled = false
    async function fetchQuestions() {
      try {
        const data = await api.getScreeningForm()
        if (Array.isArray(data?.questions)) {
          if (!cancelled) {
            setQuestions(data.questions)
            setInstrumentRevision(data.instrument_revision)
          }
          return
        }
      } catch (err) {
        console.error('Failed to load questions:', err)
        if (!cancelled) setQuestions([])
        toast.error(t('toast_error_api'))
      }
    }
    fetchQuestions().finally(() => { if (!cancelled) setQuestionsLoading(false) })
    return () => { cancelled = true }
  }, [t])

  useEffect(() => {
    let cancelled = false
    async function fetchChildren() {
      try {
        const data = await api.getChildren()
        if (Array.isArray(data) && !cancelled) setChildren(data)
      } catch (err) {
        console.error('Failed to load children:', err)
        if (!cancelled) setChildren([])
        toast.error(t('toast_error_api'))
      }
    }
    fetchChildren().finally(() => { if (!cancelled) setChildLoading(false) })
    return () => { cancelled = true }
  }, [t])

  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const handleSelect = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!allAnswered || !child) return
    setLoading(true)
    try {
      const jawabanList = questions.map((q) => ({
        id_pertanyaan: q.id,
        jawaban: answers[q.id],
      }))

      const payload = {
        anak_id: parseInt(childId),
        client_submission_id: submissionIdRef.current || crypto.randomUUID(),
        instrument_revision: instrumentRevision,
        jawaban: jawabanList,
      }
      submissionIdRef.current = payload.client_submission_id

      const result = await api.submitScreening(payload)
      toast.success(t('toast_created'))
      navigate(`/pengasuh/screening/${childId}/result/${result.id}`)
    } catch (err) {
      console.error('Failed to submit screening:', err)
      toast.error(t('toast_error_api'))
    } finally {
      setLoading(false)
    }
  }

  if (questionsLoading || childLoading) {
    return (
      <div className="max-w-2xl mx-auto page-enter">
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="max-w-2xl mx-auto page-enter">
        <PageHeader icon={ClipboardList} title={t('screening_title')} backTo="/pengasuh/screening" gradient />
        <div className="text-center py-16 text-on-surface-variant">{t('no_data')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <PageHeader
        icon={ClipboardList}
        title={t('screening_title')}
        subtitle={`${child.nama} · ${age} ${t('years')}`}
        backTo="/pengasuh/screening"
        gradient
        action={
          <div className="text-left md:text-right">
            <div className="flex items-center gap-3">
              <div className="w-full sm:w-[200px]">
                <div className="progress-bar" role="progressbar" aria-valuenow={answeredCount} aria-valuemax={totalQuestions} aria-label={t('screening_progress', { answered: answeredCount })}>
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <span className="text-small-cap whitespace-nowrap">
                {t('question_progress', { current: answeredCount, total: totalQuestions })}
              </span>
            </div>
          </div>
        }
      />

      {allAnswered && (
        <div className="flex items-center gap-1 text-green-700 text-sm mb-4">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>{t('screening_progress', { answered: answeredCount })}</span>
        </div>
      )}

      <div className="space-y-4 pr-1">
        {questions.map((q, index) => {
          const selected = answers[q.id]
          return (
            <div key={q.id} className="card mb-4">
              <p className="text-question mb-3">
                <span className="text-ink-muted mr-2">{index + 1}.</span>
                {i18n.language === 'id' ? q.teks_pertanyaan : q.teks_pertanyaan_en}
              </p>
              <div className="space-y-3" role="radiogroup" aria-label={t('screening_question_number', { number: index + 1 })}>
                {ANSWER_LABELS.map((ans) => {
                  const isSelected = selected === ans
                  const answerText = t(ANSWER_KEYS[ANSWER_LABELS.indexOf(ans)])
                  return (
                    <button
                      key={ans}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={t('screening_answer_aria', { answer: answerText, number: index + 1 })}
                      className={`w-full flex items-center gap-4 text-left px-5 py-4 rounded-[12px] transition-all min-h-[48px] ${
                        isSelected
                          ? 'bg-primary/10 border-2 border-primary text-primary font-semibold'
                          : 'bg-white border border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-lowest'
                      }`}
                      onClick={() => handleSelect(q.id, ans)}
                    >
                      <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary' : 'border-text-muted'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      {answerText}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <Button
          className="w-full justify-center"
          disabled={!allAnswered || loading || totalQuestions === 0}
          onClick={handleSubmit}
          loading={loading}
        >
          {t('screening_submit')}
        </Button>
      </div>
    </div>
  )
}
