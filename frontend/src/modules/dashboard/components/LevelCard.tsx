import type { LevelWithProgress } from '@core/types/game.types'

const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar',
  balancing: 'Balanceo',
  stoichiometry: 'Estequiometría',
  limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento %',
}

const DIFFICULTY_LABELS = ['', 'Básico', 'Fácil', 'Intermedio', 'Difícil', 'Experto']

interface LevelCardProps {
  level: LevelWithProgress
  onPlay: () => void
}

export function LevelCard({ level, onPlay }: LevelCardProps) {
  const isLocked = !level.isUnlocked
  const status = isLocked ? 'LOCKED' : (level.progress?.status ?? 'AVAILABLE')
  const stars = level.progress?.stars ?? 0
  const isCompleted = status === 'COMPLETED'

  return (
    <div
      className={`card flex flex-col gap-3 transition-all duration-200 ${
        isLocked ? 'opacity-50' : 'hover:border-brand-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Nivel {level.order}
          </span>
          <h3 className="font-display text-xl font-semibold text-slate-100">{level.name}</h3>
        </div>
        {isLocked && <span className="text-2xl">🔒</span>}
        {isCompleted && <span className="text-2xl">✅</span>}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="rounded bg-slate-700 px-2 py-0.5">
          {TOPIC_LABELS[level.topic] ?? level.topic}
        </span>
        <span className="rounded bg-slate-700 px-2 py-0.5">
          {DIFFICULTY_LABELS[level.difficulty]}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className={`text-lg ${i < stars ? 'text-yellow-400' : 'text-slate-700'}`}>
            ★
          </span>
        ))}
        {level.progress?.highScore ? (
          <span className="ml-auto text-sm text-slate-400">
            Mejor: {level.progress.highScore} pts
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span className="text-game-xp font-medium">+{level.xpReward} XP</span>
        <span className="text-game-coins font-medium">+{level.coinsReward} 🪙</span>
      </div>

      <button
        onClick={onPlay}
        disabled={isLocked}
        className="btn-primary mt-auto w-full disabled:cursor-not-allowed"
      >
        {isCompleted ? 'Repetir' : status === 'IN_PROGRESS' ? 'Continuar' : 'Jugar'}
      </button>
    </div>
  )
}
