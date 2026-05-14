import { useEffect, useState } from 'react'
import { teacherService } from '../../services/teacher.service'
import type { TeacherQuestion, QuestionDraft, BankQuestion } from '../../services/teacher.service'
import { chemFormat } from '../../../game/utils/chemFormat'
import { QuestionEditor } from '../../components/QuestionEditor'
import type { QuestionEditorInitialValues } from '../../components/QuestionEditor'
import { useAuthStore } from '@stores/authStore'
import { TOPIC_LABELS, STATUS_LABELS, TYPE_SHORT, LoadingSkeleton } from './shared'

export function BankTab() {
  const user = useAuthStore((s) => s.user)
  const [subTab, setSubTab] = useState<'bank' | 'new' | 'mine'>('bank')

  const [bankQuestions, setBankQuestions]     = useState<BankQuestion[]>([])
  const [loadingBank, setLoadingBank]         = useState(false)
  const [topicFilter, setTopicFilter]         = useState('ALL')
  const [search, setSearch]                   = useState('')
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null)
  const [updating, setUpdating]               = useState(false)
  const [bankExpandedId, setBankExpandedId]   = useState<string | null>(null)

  const [myQuestions, setMyQuestions]         = useState<TeacherQuestion[]>([])
  const [loadingMine, setLoadingMine]         = useState(false)
  const [expandedId, setExpandedId]           = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const loadBank = async () => {
    setLoadingBank(true)
    try { setBankQuestions(await teacherService.getBankQuestions()) }
    catch { /* silencioso */ }
    finally { setLoadingBank(false) }
  }

  const loadMine = async () => {
    setLoadingMine(true)
    try { setMyQuestions(await teacherService.getMyQuestions()) }
    catch { /* silencioso */ }
    finally { setLoadingMine(false) }
  }

  useEffect(() => {
    if (subTab === 'bank') loadBank()
    if (subTab === 'mine') loadMine()
  }, [subTab])

  const handleSubmit = async (draft: QuestionDraft) => {
    setSubmitting(true)
    try { await teacherService.createQuestion(draft) }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async (draft: QuestionDraft) => {
    if (!editingQuestion) return
    setUpdating(true)
    try {
      const updated = await teacherService.updateQuestion(editingQuestion.id, draft)
      setBankQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q))
      setEditingQuestion(null)
    } finally { setUpdating(false) }
  }

  const topics   = ['ALL', ...Array.from(new Set(bankQuestions.map((q) => q.topic)))]
  const filtered = bankQuestions
    .filter((q) => topicFilter === 'ALL' || q.topic === topicFilter)
    .filter((q) => !search || q.stem.toLowerCase().includes(search.toLowerCase()))

  if (editingQuestion) {
    const iv: QuestionEditorInitialValues = {
      type:          editingQuestion.type,
      topic:         editingQuestion.topic,
      difficulty:    editingQuestion.difficulty,
      stem:          editingQuestion.stem,
      explanation:   editingQuestion.explanation,
      options:       editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingQuestion(null)}
            className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            ← Volver al banco
          </button>
          <h2 className="font-display text-lg font-semibold text-slate-100">Editar pregunta</h2>
        </div>
        <div className="card">
          <QuestionEditor
            key={editingQuestion.id}
            onSubmit={handleUpdate}
            submitting={updating}
            submitLabel="Guardar cambios"
            successMessage="Pregunta actualizada correctamente."
            hideNote
            initialValues={iv}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {([
          ['bank', 'Banco'],
          ['new',  'Nueva pregunta'],
          ['mine', `Mis envíos${myQuestions.length > 0 ? ` (${myQuestions.length})` : ''}`],
        ] as ['bank' | 'new' | 'mine', string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              subTab === key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por enunciado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {topics.map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    topicFilter === t ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                  {t === 'ALL' ? 'Todos' : TOPIC_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          </div>

          {loadingBank ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2">Pregunta</th>
                      <th className="px-4 py-2">Tema</th>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2 text-center">Dif.</th>
                      <th className="px-4 py-2">Autor</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => {
                      const isOpen = bankExpandedId === q.id
                      const toggle = () => setBankExpandedId(isOpen ? null : q.id)
                      return (
                        <>
                          <tr
                            key={q.id}
                            onClick={toggle}
                            className={`cursor-pointer border-b border-game-border/50 hover:bg-slate-800/30 ${isOpen ? 'bg-slate-800/40' : ''}`}
                          >
                            <td className="max-w-xs px-4 py-2">
                              <p className="truncate text-xs text-slate-200">{chemFormat(q.stem)}</p>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-400">{TOPIC_LABELS[q.topic] ?? q.topic}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{TYPE_SHORT[q.type] ?? q.type}</td>
                            <td className="px-4 py-2 text-center text-xs text-amber-500">
                              {'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-500">
                              {q.author?.profile?.displayName ?? q.author?.username ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {q.authorId === user?.id && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingQuestion(q) }}
                                    className="rounded border border-sky-800/50 bg-sky-900/20 px-2 py-1 text-xs text-sky-400 hover:bg-sky-900/40"
                                  >
                                    Editar
                                  </button>
                                )}
                                <span className={`text-xs ${isOpen ? 'text-brand-400' : 'text-slate-500'}`}>
                                  {isOpen ? '▲' : '▼'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr key={`${q.id}-detail`} className="border-b border-game-border/50 bg-slate-900/60">
                              <td colSpan={6} className="px-6 py-4">
                                <BankQuestionDetail question={q} />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                          {bankQuestions.length === 0
                            ? 'No hay preguntas aprobadas en el banco aún.'
                            : 'Sin resultados para este filtro.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'new' && (
        <div className="card">
          <QuestionEditor onSubmit={handleSubmit} submitting={submitting} />
        </div>
      )}

      {subTab === 'mine' && (
        <div className="space-y-3">
          {loadingMine ? (
            <LoadingSkeleton rows={3} />
          ) : myQuestions.length === 0 ? (
            <div className="rounded-xl border border-game-border bg-game-surface p-8 text-center">
              <p className="text-sm text-slate-500">No has enviado preguntas aún.</p>
            </div>
          ) : (
            myQuestions.map((q) => {
              const st = STATUS_LABELS[q.status] ?? STATUS_LABELS.PENDING
              return (
                <div key={q.id} className="card overflow-hidden p-0">
                  <div
                    className="flex cursor-pointer items-start gap-3 px-4 py-3"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                        <span>{TOPIC_LABELS[q.topic] ?? q.topic}</span>
                        <span>{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-200">{chemFormat(q.stem)}</p>
                      {q.reviewNote && (
                        <p className="mt-1 text-xs text-amber-400">Nota: {q.reviewNote}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{expandedId === q.id ? '▲' : '▼'}</span>
                  </div>
                  {expandedId === q.id && q.options && (
                    <div className="space-y-1 border-t border-game-border/50 px-4 pb-3 pt-2">
                      {(q.options as { id: string; text: string }[]).map((opt) => {
                        const correct = q.type !== 'NUMERIC_INPUT'
                          ? (q.correctAnswer as { id: string }).id === opt.id
                          : false
                        return (
                          <div key={opt.id} className={`rounded px-3 py-1.5 text-sm ${
                            correct
                              ? 'border border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                              : 'border border-slate-700/40 text-slate-400'
                          }`}>
                            <span className="mr-1.5 font-semibold">{opt.id.toUpperCase()}.</span>
                            {chemFormat(opt.text)}
                            {correct && <span className="ml-1.5 text-xs">✓</span>}
                          </div>
                        )
                      })}
                      {q.explanation && (
                        <p className="pt-1 text-xs text-slate-400">
                          <span className="text-slate-500">Explicación:</span>{' '}
                          {chemFormat(q.explanation)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function BankQuestionDetail({ question: q }: { question: BankQuestion }) {
  const isMC = q.type === 'MULTIPLE_CHOICE' || q.type === 'EQUATION_BALANCE'
  const isNumeric = q.type === 'NUMERIC_INPUT'
  const correctId = isMC && q.correctAnswer && 'id' in (q.correctAnswer as object)
    ? (q.correctAnswer as { id: string }).id
    : null
  const numAnswer = isNumeric && q.correctAnswer && 'value' in (q.correctAnswer as object)
    ? (q.correctAnswer as { value: number; tolerance: number })
    : null

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Enunciado</p>
        <p className="text-sm leading-relaxed text-slate-200">{chemFormat(q.stem)}</p>
      </div>

      {isMC && q.options && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Opciones</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {(q.options as { id: string; text: string }[]).map((opt) => {
              const isCorrect = opt.id === correctId
              return (
                <div key={opt.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isCorrect
                    ? 'border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                    : 'border-slate-700/40 text-slate-400'
                }`}>
                  <span className={`flex-shrink-0 font-bold ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {opt.id.toUpperCase()}.
                  </span>
                  <span>{chemFormat(opt.text)}</span>
                  {isCorrect && <span className="ml-auto flex-shrink-0 text-xs text-emerald-500">✓ Correcta</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isNumeric && numAnswer && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Respuesta numérica</p>
          <p className="text-sm text-emerald-300">
            {numAnswer.value}
            {numAnswer.tolerance > 0 && <span className="text-slate-400"> ± {numAnswer.tolerance}</span>}
          </p>
        </div>
      )}

      {q.explanation && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Explicación</p>
          <p className="text-sm text-slate-300">{chemFormat(q.explanation)}</p>
        </div>
      )}
    </div>
  )
}
