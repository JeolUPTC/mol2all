import { useState } from 'react'
import { useGameStore } from '@stores/gameStore'
import { THEORY, DEFAULT_THEORY } from '../data/theory.data'
import type { LevelTopic } from '@core/types/game.types'

interface GameHUDProps {
  levelName: string
  topic: LevelTopic
  onExit: () => void
}

const MIXED_TOPICS = ['molar_mass', 'balancing', 'stoichiometry', 'limiting_reagent', 'yield'] as const
const TOPIC_SHORT: Record<string, string> = {
  molar_mass:       'Masa M.',
  balancing:        'Balanceo',
  stoichiometry:    'Estoq.',
  limiting_reagent: 'React. L.',
  yield:            'Rendim.',
}

export function GameHUD({ levelName, topic, onExit }: GameHUDProps) {
  const lives             = useGameStore((s) => s.lives)
  const score             = useGameStore((s) => s.score)
  const energy            = useGameStore((s) => s.energy)
  const answered          = useGameStore((s) => s.questionsAnswered)
  const total             = useGameStore((s) => s.questionsTotal)
  const [showTheory, setShowTheory] = useState(false)
  const isMixed = topic === 'mixed'
  const [activeTab, setActiveTab] = useState<string>('molar_mass')

  const theory = THEORY[isMixed ? activeTab : topic] ?? DEFAULT_THEORY
  const energyPct   = Math.max(0, Math.min(100, energy))
  const progressPct = total > 0 ? (answered / total) * 100 : 0
  const energyColor = energyPct > 60 ? 'bg-emerald-500' : energyPct > 30 ? 'bg-orange-400' : 'bg-red-500'

  const openTheory = () => {
    window.dispatchEvent(new CustomEvent('mol2all:theory:open'))
    setShowTheory(true)
  }
  const closeTheory = () => {
    window.dispatchEvent(new CustomEvent('mol2all:theory:close'))
    setShowTheory(false)
  }

  return (
    <>
      {/* ── HUD bar ──────────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 sm:gap-4 sm:px-6">

        {/* Exit */}
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-700"
        >
          ← Salir
        </button>

        {/* Level name */}
        <span className="font-display hidden truncate text-sm font-bold text-slate-200 sm:block sm:text-base">
          {levelName}
        </span>

        {/* Lives */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-base sm:text-lg ${i < lives ? 'text-red-400' : 'text-slate-700'}`}>♥</span>
          ))}
        </div>

        {/* Score */}
        <span className="font-display text-sm font-bold text-emerald-400 sm:text-base">
          {score.toLocaleString()} pts
        </span>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-sky-400">▶</span>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700 sm:h-2.5 sm:w-28 lg:w-36">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 sm:text-sm">{answered}/{total}</span>
        </div>

        {/* Energy bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-yellow-400">⚡</span>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700 sm:h-2.5 sm:w-24 lg:w-28">
            <div
              className={`h-full rounded-full transition-all duration-300 ${energyColor}`}
              style={{ width: `${energyPct}%` }}
            />
          </div>
        </div>

        {/* Theory button */}
        <button
          onClick={openTheory}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-sky-900 bg-sky-950 px-3 py-1.5 text-sm font-semibold text-sky-300 transition hover:border-sky-500 hover:bg-sky-900"
        >
          📖 Teoría
        </button>
      </div>

      {/* ── Theory modal overlay ──────────────────────────────────────── */}
      {showTheory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} className="flex items-center justify-center bg-black/80 p-4">
          <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-sky-800 bg-slate-900 shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="font-display text-xl font-bold text-sky-400">📖 {theory.title}</h2>
              <button
                onClick={closeTheory}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Topic tabs — mixed levels only */}
            {isMixed && (
              <div className="flex gap-1 overflow-x-auto border-b border-slate-700 bg-slate-900/80 px-4 pt-2">
                {MIXED_TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`shrink-0 rounded-t-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === t
                        ? 'border border-b-0 border-slate-600 bg-slate-800 text-sky-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {TOPIC_SHORT[t]}
                  </button>
                ))}
              </div>
            )}

            {/* Modal content */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <p className="text-base text-slate-400">{theory.subtitle}</p>
              <p className="text-base leading-relaxed text-slate-300">{theory.concept}</p>

              <div className="rounded-xl border-2 border-sky-900 bg-slate-950 px-5 py-4 text-center">
                <p className="font-mono text-2xl font-bold text-sky-300">{theory.formula}</p>
                <p className="mt-1 text-sm text-slate-500">{theory.formulaLabel}</p>
              </div>

              <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-4 py-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-yellow-400">💡 Ejemplo</p>
                <p className="font-mono text-lg text-yellow-200">{theory.example}</p>
              </div>

              <div>
                <p className="mb-2 font-bold text-emerald-400">✦ Pasos clave</p>
                <ol className="space-y-2">
                  {theory.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-sky-300">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-slate-700 p-4">
              <button
                onClick={closeTheory}
                className="w-full rounded-xl bg-sky-700 py-3 text-base font-bold text-white transition hover:bg-sky-600"
              >
                ✕ Cerrar y seguir jugando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
