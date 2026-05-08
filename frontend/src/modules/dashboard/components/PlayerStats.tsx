import { useAuthStore } from '@stores/authStore'

export function PlayerStats() {
  const profile = useAuthStore((s) => s.user?.profile)

  if (!profile) return null

  return (
    <div className="flex items-center gap-3">
      <div className="card flex items-center gap-2 px-3 py-2">
        <span className="text-lg">⚡</span>
        <div>
          <p className="text-xs text-slate-400">XP Total</p>
          <p className="font-display text-sm font-bold text-game-xp">{profile.totalXp}</p>
        </div>
      </div>
      <div className="card flex items-center gap-2 px-3 py-2">
        <span className="text-lg">🪙</span>
        <div>
          <p className="text-xs text-slate-400">Monedas</p>
          <p className="font-display text-sm font-bold text-game-coins">{profile.totalCoins}</p>
        </div>
      </div>
    </div>
  )
}
