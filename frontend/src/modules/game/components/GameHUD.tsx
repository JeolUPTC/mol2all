import { useGameStore } from '@stores/gameStore'

interface GameHUDProps {
  levelName: string
  onExit: () => void
}

export function GameHUD({ levelName, onExit }: GameHUDProps) {
  const lives = useGameStore((s) => s.lives)
  const score = useGameStore((s) => s.score)
  const energy = useGameStore((s) => s.energy)

  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900 px-4 py-2">
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-700"
      >
        ← Salir
      </button>

      <span className="font-display truncate text-base font-bold text-slate-200">
        {levelName}
      </span>

      <div className="ml-auto flex items-center gap-5">
        {/* Lives */}
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-lg ${i < lives ? 'text-red-400' : 'text-slate-700'}`}>
              ♥
            </span>
          ))}
        </div>

        {/* Score */}
        <span className="font-display text-sm font-bold text-sky-400">
          {score.toLocaleString()} pts
        </span>

        {/* Energy bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">⚡</span>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, energy))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
