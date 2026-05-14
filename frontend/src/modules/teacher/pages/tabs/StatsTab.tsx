import { useEffect, useState, type ReactNode } from 'react'
import { teacherService } from '../../services/teacher.service'
import type { TeacherAnalytics } from '../../services/teacher.service'
import { HBarList, VBarChart } from '@shared/components/ui/Charts'
import { LoadingSkeleton } from './shared'

const GROUP_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b']

export function StatsTab() {
  const [data, setData] = useState<TeacherAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teacherService.getAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton rows={4} />
  if (!data) return <p className="text-center text-sm text-slate-500">No se pudieron cargar los datos.</p>

  const { kpis } = data
  const pctColor = (v: number) => v >= 60 ? 'text-emerald-400' : v >= 30 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Mis estudiantes"  value={kpis.totalStudents}    color="text-sky-400" />
        <StatCard label="XP promedio"      value={kpis.avgXp}            color="text-game-xp" />
        <StatCard label="Niveles promedio" value={kpis.avgLevels}        color="text-emerald-400" />
        <StatCard
          label="Alumnos activos"
          value={kpis.activeStudentPct}
          color={pctColor(kpis.activeStudentPct)}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Completación por nivel (% de mis alumnos)">
          {data.levelCompletion.length > 0
            ? <HBarList
                items={data.levelCompletion.map((l) => ({ label: l.levelName, value: l.pct, suffix: '%' }))}
                max={100}
              />
            : <p className="text-sm text-slate-500">Sin datos de progreso aún.</p>
          }
        </ChartCard>
        <ChartCard title="Distribución de estrellas">
          <VBarChart
            items={data.starsDistribution.map((s) => ({
              label: '★'.repeat(s.stars),
              value: s.count,
              color: s.stars === 3 ? '#34d399' : s.stars === 2 ? '#fbbf24' : '#94a3b8',
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.groupComparison.length > 1 && (
          <ChartCard title="Comparativa entre grupos (XP promedio)">
            <VBarChart
              height={140}
              items={data.groupComparison.map((g, i) => ({
                label: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
                value: g.avgXp,
                color: GROUP_COLORS[i % GROUP_COLORS.length],
              }))}
            />
          </ChartCard>
        )}
        {data.topStudents.length > 0 && (
          <ChartCard title="Top 5 estudiantes">
            <TopStudents students={data.topStudents} showGroup={data.groupComparison.length > 1} />
          </ChartCard>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, suffix = '' }: {
  label: string; value: number; color: string; suffix?: string
}) {
  return (
    <div className="card space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}{suffix}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

function TopStudents({
  students,
  showGroup = false,
}: {
  students: { displayName: string; totalXp: number; levelsCompleted: number; groupName: string | null }[]
  showGroup?: boolean
}) {
  return (
    <div className="space-y-3">
      {students.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-400">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{s.displayName}</p>
            {showGroup && s.groupName && (
              <p className="truncate text-xs text-slate-500">{s.groupName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-game-xp">{s.totalXp} XP</p>
            <p className="text-xs text-slate-500">{s.levelsCompleted} niveles</p>
          </div>
        </div>
      ))}
    </div>
  )
}
