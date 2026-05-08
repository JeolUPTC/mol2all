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
    const load = async () => {
      try {
        const qs = await questionsService.generateBatch(
          levelConfig.topic,
          levelConfig.difficulty,
          levelConfig.totalQuestions,
        )
        if (mounted) { setQuestions(qs); setLoading(false) }
      } catch {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [levelConfig])

  const handlePlay = () => { if (questions) onPlay(questions) }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900 px-6 py-3">
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-700 hover:text-white"
        >
          ← Salir
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            {TOPIC_LABELS[levelConfig.topic] ?? levelConfig.topic}
            &nbsp;·&nbsp;
            {'★'.repeat(levelConfig.difficulty)}{'☆'.repeat(3 - levelConfig.difficulty)}
          </p>
          <h1 className="font-display truncate text-xl font-bold text-slate-100">
            {levelConfig.levelName}
          </h1>
        </div>

        <button
          onClick={handlePlay}
          disabled={loading || !questions}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-base font-bold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Cargando...
            </>
          ) : '▶ ¡Jugar!'}
        </button>
      </header>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Title + subtitle */}
          <div>
            <h2 className="font-display text-3xl font-bold text-sky-400">
              📖 {theory.title}
            </h2>
            <p className="mt-1 text-lg text-slate-400">{theory.subtitle}</p>
          </div>

          <hr className="border-slate-800" />

          {/* Concept */}
          <p className="text-lg leading-relaxed text-slate-300">{theory.concept}</p>

          {/* Formula box */}
          <div className="rounded-xl border-2 border-sky-900 bg-slate-900 px-6 py-5 text-center shadow-lg shadow-sky-950/40">
            <p className="font-mono text-3xl font-bold text-sky-300">{theory.formula}</p>
            <p className="mt-2 text-sm text-slate-500">{theory.formulaLabel}</p>
          </div>

          {/* Example */}
          <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-5 py-4">
            <p className="mb-1 text-sm font-bold uppercase tracking-wide text-yellow-400">
              💡 Ejemplo práctico
            </p>
            <p className="font-mono text-xl text-yellow-200">{theory.example}</p>
          </div>

          {/* Steps */}
          <div>
            <p className="mb-3 text-lg font-bold text-emerald-400">✦ Pasos clave</p>
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
      </main>

      {/* ── Footer: big play button ───────────────────────────────────── */}
      <footer className="shrink-0 border-t border-slate-800 bg-slate-900 p-4">
        <button
          onClick={handlePlay}
          disabled={loading || !questions}
          className="w-full rounded-xl bg-sky-600 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Preparando preguntas...
            </span>
          ) : '▶  ¡Jugar ahora!'}
        </button>
      </footer>

    </div>
  )
}
