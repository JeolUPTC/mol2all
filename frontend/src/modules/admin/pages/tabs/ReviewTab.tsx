import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { PendingQuestion } from '../../services/admin.service'
import { chemFormat } from '../../../game/utils/chemFormat'
import { TOPIC_LABELS, TYPE_LABELS, LoadingSkeleton } from './shared'

export function ReviewTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [questions, setQuestions] = useState<PendingQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [reviewingId, setRevId]   = useState<string | null>(null)
  const [noteText, setNoteText]   = useState<Record<string, string>>({})

  useEffect(() => {
    adminService.getPendingQuestions()
      .then((qs) => {
        setQuestions(qs)
        onCountChange(qs.filter((q) => q.status === 'PENDING').length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [onCountChange])

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setRevId(id)
    try {
      await adminService.reviewQuestion(id, { status, reviewNote: noteText[id]?.trim() || undefined })
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      onCountChange(questions.filter((q) => q.id !== id && q.status === 'PENDING').length)
    } catch { /* silencioso */ }
    finally { setRevId(null) }
  }

  const pending  = questions.filter((q) => q.status === 'PENDING')
  const rejected = questions.filter((q) => q.status === 'REJECTED')

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <div className="rounded-xl border border-game-border bg-game-surface p-12 text-center">
          <p className="text-lg text-emerald-400">✓ Sin preguntas pendientes</p>
          <p className="mt-1 text-sm text-slate-500">Todas las contribuciones han sido revisadas.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-200">
                Pendientes de revisión
                <span className="ml-2 rounded-full bg-amber-900/50 px-2 py-0.5 text-sm text-amber-300">
                  {pending.length}
                </span>
              </h2>
              {pending.map((q) => (
                <ReviewCard key={q.id} question={q}
                  note={noteText[q.id] ?? ''}
                  onNoteChange={(v) => setNoteText((p) => ({ ...p, [q.id]: v }))}
                  onApprove={() => review(q.id, 'APPROVED')}
                  onReject={() => review(q.id, 'REJECTED')}
                  busy={reviewingId === q.id}
                />
              ))}
            </section>
          )}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-400">
                Rechazadas previamente
                <span className="ml-2 text-sm text-red-500">{rejected.length}</span>
              </h2>
              {rejected.map((q) => (
                <ReviewCard key={q.id} question={q}
                  note={noteText[q.id] ?? ''}
                  onNoteChange={(v) => setNoteText((p) => ({ ...p, [q.id]: v }))}
                  onApprove={() => review(q.id, 'APPROVED')}
                  onReject={() => review(q.id, 'REJECTED')}
                  busy={reviewingId === q.id}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function ReviewCard({ question: q, note, onNoteChange, onApprove, onReject, busy }: {
  question: PendingQuestion; note: string; onNoteChange: (v: string) => void
  onApprove: () => void; onReject: () => void; busy: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const author = q.author?.profile?.displayName ?? q.author?.username ?? 'Desconocido'
  const correctMC = q.type !== 'NUMERIC_INPUT' ? (q.correctAnswer as { id: string }).id : null
  const correctNum = q.type === 'NUMERIC_INPUT' ? (q.correctAnswer as { value: number; tolerance: number }) : null

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-violet-900/40 px-1.5 py-0.5 text-violet-300">{author}</span>
            <span>{TOPIC_LABELS[q.topic] ?? q.topic}</span>
            <span>{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</span>
            <span className="rounded bg-slate-700/60 px-1.5 py-0.5">{TYPE_LABELS[q.type] ?? q.type}</span>
            <span>{new Date(q.createdAt).toLocaleDateString('es')}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-200">{chemFormat(q.stem)}</p>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 text-xs text-slate-500 hover:text-slate-300">
          {expanded ? 'Contraer ▲' : 'Expandir ▼'}
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-game-border/50 px-4 pb-4 pt-3">
          {q.options && q.options.length > 0 && (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {q.options.map((opt) => (
                <div key={opt.id} className={`rounded px-3 py-1.5 text-sm ${
                  correctMC === opt.id
                    ? 'border border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                    : 'border border-slate-700/40 bg-slate-800/40 text-slate-300'
                }`}>
                  <span className="mr-1.5 font-semibold">{opt.id.toUpperCase()}.</span>
                  {chemFormat(opt.text)}
                  {correctMC === opt.id && <span className="ml-1.5 text-xs">✓</span>}
                </div>
              ))}
            </div>
          )}
          {correctNum && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Respuesta:</span>{' '}
              <span className="font-semibold text-emerald-400">{correctNum.value}</span>
              {correctNum.tolerance > 0 && <span className="ml-1 text-slate-500">± {correctNum.tolerance}</span>}
            </p>
          )}
          {q.explanation && (
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Explicación:</span> {chemFormat(q.explanation)}
            </p>
          )}
          {q.reviewNote && (
            <p className="rounded border border-amber-800/40 bg-amber-900/20 px-2 py-1.5 text-xs text-amber-300">
              <span className="font-semibold">Nota anterior:</span> {q.reviewNote}
            </p>
          )}
          <div className="space-y-1">
            <label className="block text-xs text-slate-500">Nota para el docente (opcional)</label>
            <input type="text" value={note} onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Ej: Falta indicar las masas atómicas."
              className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onApprove} disabled={busy}
              className="flex-1 rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              {busy ? '…' : '✓ Aprobar'}
            </button>
            <button onClick={onReject} disabled={busy}
              className="flex-1 rounded-lg border border-red-700/60 bg-red-900/20 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/40 disabled:opacity-50">
              {busy ? '…' : '✗ Rechazar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
