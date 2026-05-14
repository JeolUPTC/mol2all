import { useEffect, useMemo, useState } from 'react'

interface LevelConfig {
  topic: string
  difficulty: number
  levelName: string
  totalQuestions: number
  levelOrder: number
}

export interface ResultData {
  score: number
  stars: number
  win: boolean
  levelConfig?: LevelConfig
}

interface ResultOverlayProps {
  data: ResultData
  onRetry: (levelConfig?: LevelConfig) => void
  onExit: () => void
}

export function ResultOverlay({ data, onRetry, onExit }: ResultOverlayProps) {
  const { score, stars, win, levelConfig } = data
  const [displayScore, setDisplayScore] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const steps = 40
    const inc = score / steps
    let current = 0
    const id = setInterval(() => {
      current = Math.min(current + inc, score)
      setDisplayScore(Math.floor(current))
      if (current >= score) clearInterval(id)
    }, 1000 / steps)
    return () => clearInterval(id)
  }, [visible, score])

  const msg =
    stars === 3 ? '¡Perfecto! Respondiste todo correctamente.' :
    stars === 2 ? '¡Muy bien! Puedes mejorar aún más.' :
    win         ? 'Sigue practicando para mejorar tu puntaje.' :
                  '¡No te rindas! Intenta de nuevo.'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className={`flex items-center justify-center bg-black/80 p-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {win && <Confetti />}

      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 p-8 shadow-2xl">

        {/* Top accent line */}
        <div className={`absolute inset-x-0 top-0 h-1 rounded-t-3xl ${win ? 'bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500' : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600'}`} />

        {/* Icon + title */}
        <div className="mt-1 text-center">
          <p className="text-5xl">{win ? '🏆' : '💀'}</p>
          <h2 className={`mt-3 font-display text-3xl font-black tracking-tight ${win ? 'text-emerald-400' : 'text-red-400'}`}>
            {win ? '¡Nivel Completado!' : 'Fin del juego'}
          </h2>
          {levelConfig && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {levelConfig.levelName}
            </p>
          )}
        </div>

        {/* Stars */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-5xl transition-all duration-500 ${i < stars ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'text-slate-700'}`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              {i < stars ? '★' : '☆'}
            </span>
          ))}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-700/50 bg-slate-800/60 px-10 py-4">
          <p className="font-display text-5xl font-black tabular-nums text-emerald-400">
            {displayScore.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">puntos</p>
        </div>

        {/* Message */}
        <p className="text-center text-sm leading-relaxed text-slate-400">{msg}</p>

        {/* Buttons */}
        <div className="flex w-full gap-3">
          <button
            onClick={() => onRetry(levelConfig)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            ↺ Reintentar
          </button>
          <button
            onClick={onExit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white transition hover:bg-sky-500 active:scale-95"
          >
            ⌂ Niveles
          </button>
        </div>
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#f472b6', '#a78bfa', '#ef4444']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        width: `${5 + Math.random() * 5}px`,
        height: `${7 + Math.random() * 7}px`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        duration: `${1.6 + Math.random() * 1.4}s`,
        delay: `${Math.random() * 1.2}s`,
        rotate: `${Math.random() * 360}deg`,
      })),
    [],
  )

  return (
    <>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: '-12px',
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: '2px',
            transform: `rotate(${p.rotate})`,
            animation: `confetti-fall ${p.duration} ${p.delay} linear forwards`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
