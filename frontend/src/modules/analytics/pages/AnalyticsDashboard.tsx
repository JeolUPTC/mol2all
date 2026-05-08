import { useEffect, useState } from 'react'
import { analyticsService } from '../services/analytics.service'
import type { AnalyticsOverview } from '../services/analytics.service'

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsService
      .getOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Analíticas</h1>

      {/* Platform stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-game-surface" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Estudiantes" value={data.platform.totalStudents} color="text-brand-300" />
          <StatCard label="Docentes" value={data.platform.totalTeachers} color="text-violet-400" />
          <StatCard
            label="Sesiones completadas"
            value={data.platform.totalCompletedSessions}
            color="text-game-xp"
          />
          <StatCard
            label="Niveles completados"
            value={data.platform.totalCompletedLevels}
            color="text-emerald-400"
          />
          <StatCard
            label="Prom. estrellas"
            value={data.platform.avgStarsOverall}
            color="text-amber-400"
            decimals
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity chart */}
        <div className="card lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-200">
            Actividad — últimos 7 días
          </h2>
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-game-surface" />
          ) : data ? (
            <ActivityChart days={data.activity} />
          ) : null}
        </div>

        {/* Top students */}
        <div className="card">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-200">
            Top estudiantes
          </h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-game-surface" />
              ))}
            </div>
          ) : data && data.topStudents.length > 0 ? (
            <ol className="space-y-2">
              {data.topStudents.map((s, idx) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-game-border bg-slate-800/50 px-3 py-2"
                >
                  <span
                    className={`w-5 text-center font-display text-sm font-bold ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                          ? 'text-slate-300'
                          : idx === 2
                            ? 'text-amber-700'
                            : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {s.displayName ?? s.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.completedLevels} nivel{s.completedLevels !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-game-xp">
                    {s.totalXp} XP
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-center text-sm text-slate-500">Sin datos.</p>
          )}
        </div>
      </div>

      {/* Level performance */}
      {data && data.levelPerformance.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="border-b border-game-border px-4 py-3">
            <h2 className="font-display text-base font-semibold text-slate-200">
              Rendimiento por nivel
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Nivel</th>
                  <th className="px-4 py-2">Tema</th>
                  <th className="px-4 py-2 text-right">Completados</th>
                  <th className="px-4 py-2 text-right">Intentos</th>
                  <th className="px-4 py-2 text-right">Prom. ★</th>
                  <th className="px-4 py-2">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {data.levelPerformance.map((l) => {
                  const rate =
                    data.platform.totalStudents > 0
                      ? Math.round((l.completionCount / data.platform.totalStudents) * 100)
                      : 0
                  return (
                    <tr
                      key={l.levelId}
                      className="border-b border-game-border/50 transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-2 text-slate-500">{l.levelOrder}</td>
                      <td className="px-4 py-2 font-medium text-slate-200">{l.levelName}</td>
                      <td className="px-4 py-2 text-slate-400">{l.topic}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-400">
                        {l.completionCount}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                        {l.totalAttempts}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-amber-400">
                        {l.avgStars.toFixed(1)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-400">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  decimals = false,
}: {
  label: string
  value: number
  color: string
  decimals?: boolean
}) {
  return (
    <div className="card space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-2xl font-bold ${color}`}>
        {decimals ? value.toFixed(1) : value}
      </p>
    </div>
  )
}

function ActivityChart({ days }: { days: { date: string; sessions: number }[] }) {
  const max = Math.max(...days.map((d) => d.sessions), 1)

  return (
    <div className="flex h-40 items-end gap-2">
      {days.map(({ date, sessions }) => {
        const pct = Math.round((sessions / max) * 100)
        const label = new Date(date + 'T12:00:00').toLocaleDateString('es', {
          weekday: 'short',
          day: 'numeric',
        })
        return (
          <div key={date} className="group flex flex-1 flex-col items-center gap-1">
            <span className="text-xs tabular-nums text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
              {sessions}
            </span>
            <div className="relative w-full flex-1">
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-brand-600 transition-all group-hover:bg-brand-500"
                style={{ height: `${Math.max(pct, sessions > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
