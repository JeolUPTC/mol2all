import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { ApprovedQuestion } from '../../services/admin.service'
import { chemFormat } from '../../../game/utils/chemFormat'
import { QuestionEditor } from '../../../teacher/components/QuestionEditor'
import type { QuestionEditorInitialValues } from '../../../teacher/components/QuestionEditor'
import type { QuestionDraft } from '../../../teacher/services/teacher.service'
import { TOPIC_LABELS, TYPE_LABELS, LoadingSkeleton } from './shared'

export function BankTab() {
  const [bankView, setBankView] = useState<'list' | 'create'>('list')
  const [editingQuestion, setEditingQuestion] = useState<ApprovedQuestion | null>(null)
  const [questions, setQuestions] = useState<ApprovedQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [topicFilter, setTopicFilter] = useState('ALL')
  const [toggling, setToggling]   = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    adminService.getApprovedQuestions().then(setQuestions).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      const updated = await adminService.toggleQuestion(id)
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, isActive: updated.isActive } : q))
    } catch { /* silencioso */ }
    finally { setToggling(null) }
  }

  const handleCreateQuestion = async (draft: QuestionDraft) => {
    setSubmitting(true)
    try {
      const created = await adminService.createQuestion(draft)
      setQuestions((prev) => [created, ...prev])
      setBankView('list')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateQuestion = async (draft: QuestionDraft) => {
    if (!editingQuestion) return
    setSubmitting(true)
    try {
      const updated = await adminService.updateQuestion(editingQuestion.id, draft)
      setQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q))
      setEditingQuestion(null)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (q: ApprovedQuestion) => {
    setEditingQuestion(q)
    setBankView('list')
  }

  const topics = ['ALL', ...Array.from(new Set(questions.map((q) => q.topic)))]
  const filtered = questions.filter((q) => {
    const matchTopic = topicFilter === 'ALL' || q.topic === topicFilter
    const matchSearch = q.stem.toLowerCase().includes(search.toLowerCase())
    return matchTopic && matchSearch
  })

  if (loading) return <LoadingSkeleton rows={5} />

  if (editingQuestion) {
    const iv: QuestionEditorInitialValues = {
      type: editingQuestion.type as QuestionEditorInitialValues['type'],
      topic: editingQuestion.topic,
      difficulty: editingQuestion.difficulty,
      stem: editingQuestion.stem,
      explanation: editingQuestion.explanation,
      options: editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingQuestion(null)} className="text-sm text-slate-400 hover:text-slate-200">
            ← Volver al banco
          </button>
          <span className="text-sm text-slate-500">Editando pregunta</span>
        </div>
        <div className="card">
          <QuestionEditor
            key={editingQuestion.id}
            initialValues={iv}
            onSubmit={handleUpdateQuestion}
            submitting={submitting}
            submitLabel="Guardar cambios"
            successMessage="Pregunta actualizada correctamente."
            hideNote
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setBankView('list')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            bankView === 'list' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Banco de preguntas
        </button>
        <button
          onClick={() => setBankView('create')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            bankView === 'create' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          + Nueva pregunta
        </button>
      </div>

      {bankView === 'create' ? (
        <div className="card">
          <QuestionEditor
            onSubmit={handleCreateQuestion}
            submitting={submitting}
            submitLabel="Crear pregunta"
            successMessage="Pregunta creada y aprobada automáticamente."
            hideNote
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
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
            <input type="search" placeholder="Buscar enunciado…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-56 rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-500">{filtered.length} preguntas</span>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Enunciado</th>
                    <th className="px-4 py-2">Tema</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Autor</th>
                    <th className="px-4 py-2 text-center">Dif.</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                    <th className="px-4 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                      <td className="max-w-xs px-4 py-2">
                        <p className="truncate text-slate-200">{chemFormat(q.stem)}</p>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-400">{TOPIC_LABELS[q.topic] ?? q.topic}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{TYPE_LABELS[q.type] ?? q.type}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">
                        {q.author?.profile?.displayName ?? q.author?.username ?? 'Sistema'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-slate-400">
                        {'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggle(q.id)}
                          disabled={toggling === q.id}
                          className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
                            q.isActive
                              ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                              : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                          }`}
                        >
                          {toggling === q.id ? '…' : q.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => openEdit(q)} className="text-xs font-medium text-brand-400 hover:text-brand-300">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        No hay preguntas aprobadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
