import { useEffect, useState } from 'react'
import { THEORY, DEFAULT_THEORY } from '../data/theory.data'
import { questionsService, type GameQuestion } from '../services/questions.service'
import type { LevelConfig } from '../PhaserGame'

const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar',
  balancing: 'Balanceo de Ecuaciones',
  stoichiometry: 'Estequiometría',
  limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento',
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Avanzado' }

interface PreGameScreenProps {
  levelConfig: LevelConfig
  onPlay: (questions: GameQuestion[]) => void
  onExit: () => void
}

export function PreGameScreen({ levelConfig, onPlay, onExit }: PreGameScreenProps) {
  const theory = THEORY[levelConfig.topic] ?? DEFAULT_THEORY
  const [questions, setQuestions] = useState<GameQuestion[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    questionsService
      .generateBatch(levelConfig.topic, levelConfig.difficulty, levelConfig.totalQuestions)
      .then((qs) => { if (mounted) { setQuestions(qs); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [levelConfig])

  const handlePlay = () => { if (questions) onPlay(questions) }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">

      {/* ── Thin top bar ─────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-5">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-700"
        >
          ← Salir
        </button>
        <span className="font-display text-sm font-semibold text-slate-300">{levelConfig.levelName}</span>
        <span className="text-sm text-slate-500">·</span>
        <span className="text-sm font-medium text-slate-400">
          {TOPIC_LABELS[levelConfig.topic] ?? levelConfig.topic}
        </span>
        <span className="text-sm text-yellow-400">
          {'★'.repeat(levelConfig.difficulty)}{'☆'.repeat(3 - levelConfig.difficulty)}
        </span>
      </header>

      {/* ── Two-card body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">

        {/* LEFT: theory card — flex-1, scrollable */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            <div>
              <h2 className="font-display text-3xl font-bold text-sky-400">📖 {theory.title}</h2>
              <p className="mt-1 text-lg text-slate-300">{theory.subtitle}</p>
            </div>

            <hr className="border-slate-700" />

            <p className="text-base leading-relaxed text-slate-300">{theory.concept}</p>

            {/* Formula */}
            <div className="rounded-xl border-2 border-sky-800 bg-slate-950 px-6 py-5 text-center">
              <p className="font-mono text-2xl font-bold text-sky-300">{theory.formula}</p>
              <p className="mt-2 text-sm text-slate-400">{theory.formulaLabel}</p>
            </div>

            {/* Example */}
            <div className="rounded-lg border border-yellow-800/40 bg-yellow-950/20 px-5 py-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-yellow-400">
                💡 Ejemplo práctico
              </p>
              <p className="font-mono text-xl text-yellow-200">{theory.example}</p>
            </div>

            {/* Steps */}
            <div>
              <p className="mb-3 font-bold text-emerald-400">✦ Pasos clave</p>
              <ol className="space-y-3">
                {theory.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-base text-slate-300">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-300">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>

        {/* RIGHT: info + action card */}
        <div className="flex w-72 shrink-0 flex-col gap-4">

          {/* Info card */}
          <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Nivel</p>
              <h3 className="font-display mt-1 text-2xl font-bold text-slate-100 leading-tight">
                {levelConfig.levelName}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Tema</p>
              <p className="mt-1 text-lg font-semibold text-sky-400">
                {TOPIC_LABELS[levelConfig.topic] ?? levelConfig.topic}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Dificultad</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl text-yellow-400">
                  {'★'.repeat(levelConfig.difficulty)}
                  <span className="text-slate-600">{'☆'.repeat(3 - levelConfig.difficulty)}</span>
                </span>
                <span className="text-sm text-slate-400">
                  {DIFFICULTY_LABELS[levelConfig.difficulty] ?? ''}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Preguntas</p>
              <p className="mt-1 text-lg font-semibold text-slate-300">
                {levelConfig.totalQuestions} preguntas
              </p>
            </div>

            {/* Status */}
            <div className="mt-auto rounded-lg border border-slate-700 bg-slate-800 p-3 text-center text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-slate-400">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                  Preparando preguntas...
                </span>
              ) : (
                <span className="font-semibold text-emerald-400">✓ Preguntas listas</span>
              )}
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={handlePlay}
            disabled={loading || !questions}
            className="w-full rounded-2xl bg-sky-600 py-5 text-xl font-bold text-white shadow-lg shadow-sky-950 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Cargando...
              </span>
            ) : '▶  ¡Jugar ahora!'}
          </button>

        </div>
      </div>

    </div>
  )
}
