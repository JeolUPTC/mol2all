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
    <div className="flex flex-1 min-h-0 flex-col bg-slate-950 text-slate-100">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 md:gap-3 md:px-5">
        <button
          onClick={onExit}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-700"
        >
          ← Salir
        </button>
        <span className="truncate text-sm font-semibold text-slate-300">{levelConfig.levelName}</span>
        <span className="shrink-0 text-sm text-yellow-400 ml-auto md:ml-0">
          {'★'.repeat(levelConfig.difficulty)}{'☆'.repeat(3 - levelConfig.difficulty)}
        </span>
      </header>

      {/* ── Two-column body — always side by side, proportional widths ── */}
      <div className="flex flex-1 min-h-0 gap-3 overflow-hidden p-3">

        {/* LEFT: theory — flex-1, scrollable */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 md:space-y-5">

            <div>
              <h2 className="font-display text-xl font-bold text-sky-400 md:text-3xl">📖 {theory.title}</h2>
              <p className="mt-1 text-sm text-slate-300 md:text-lg">{theory.subtitle}</p>
            </div>

            <hr className="border-slate-700" />

            <p className="text-xs leading-relaxed text-slate-300 md:text-base">{theory.concept}</p>

            {/* Formula */}
            <div className="rounded-xl border-2 border-sky-800 bg-slate-950 px-3 py-3 text-center md:px-6 md:py-5">
              <p className="font-mono text-sm font-bold text-sky-300 md:text-2xl">{theory.formula}</p>
              <p className="mt-1 text-xs text-slate-400">{theory.formulaLabel}</p>
            </div>

            {/* Example */}
            <div className="rounded-lg border border-yellow-800/40 bg-yellow-950/20 px-3 py-3 md:px-5 md:py-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-yellow-400">
                💡 Ejemplo práctico
              </p>
              <p className="font-mono text-xs text-yellow-200 md:text-xl">{theory.example}</p>
            </div>

            {/* Steps */}
            <div>
              <p className="mb-2 text-sm font-bold text-emerald-400">✦ Pasos clave</p>
              <ol className="space-y-2">
                {theory.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300 md:gap-3 md:text-base">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-300 md:h-6 md:w-6">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>

        {/* RIGHT: info + play — 32% width, scrollable so button is always reachable */}
        <div className="flex w-[32%] shrink-0 flex-col gap-3 overflow-y-auto">

          {/* Info card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3 flex flex-col gap-3 md:p-6 md:gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Nivel</p>
              <h3 className="font-display mt-0.5 text-sm font-bold text-slate-100 leading-tight md:text-2xl">
                {levelConfig.levelName}
              </h3>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Tema</p>
              <p className="mt-0.5 text-xs font-semibold text-sky-400 md:text-lg">
                {TOPIC_LABELS[levelConfig.topic] ?? levelConfig.topic}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Dificultad</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <span className="text-sm text-yellow-400 md:text-xl">
                  {'★'.repeat(levelConfig.difficulty)}
                  <span className="text-slate-600">{'☆'.repeat(3 - levelConfig.difficulty)}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {DIFFICULTY_LABELS[levelConfig.difficulty] ?? ''}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Preguntas</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-300 md:text-lg">
                {levelConfig.totalQuestions} preguntas
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-center text-xs md:p-3 md:text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-1.5 text-slate-400">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                <span className="hidden md:inline">Preparando...</span>
              </span>
            ) : (
              <span className="font-semibold text-emerald-400">✓ Listas</span>
            )}
          </div>

          {/* Play button */}
          <button
            onClick={handlePlay}
            disabled={loading || !questions}
            className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white shadow-lg shadow-sky-950 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 md:py-5 md:text-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="hidden md:inline">Cargando...</span>
              </span>
            ) : (
              <>
                <span className="md:hidden">▶ Jugar</span>
                <span className="hidden md:inline">▶  ¡Jugar ahora!</span>
              </>
            )}
          </button>

        </div>
      </div>

    </div>
  )
}
