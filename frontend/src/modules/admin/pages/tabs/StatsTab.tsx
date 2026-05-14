import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminAnalytics } from '../../services/admin.service'
import { DonutChart, HBarList, VBarChart } from '@shared/components/ui/Charts'
import { LoadingSkeleton, ErrorMsg, StatCard, ChartCard, TopStudentsTable } from './shared'

const GROUP_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#f87171']

export function StatsTab() {
  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton rows={4} />
  if (!data) return <ErrorMsg />

  const pctColor = (v: number) => v >= 60 ? 'text-emerald-400' : v >= 30 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Estudiantes"       value={data.kpis.totalStudents}    color="text-sky-400" />
        <StatCard label="Docentes"          value={data.kpis.totalTeachers}    color="text-violet-400" />
        <StatCard label="Grupos activos"    value={data.kpis.totalGroups}      color="text-brand-400" />
        <StatCard label="Niveles superados" value={data.kpis.completedLevels}  color="text-emerald-400" />
        <StatCard
          label="Alumnos activos"
          value={data.kpis.activeStudentPct}
          color={pctColor(data.kpis.activeStudentPct)}
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Banco de preguntas">
          <DonutChart slices={[
            { label: 'Aprobadas',  value: data.questionStatus.approved,  color: '#34d399' },
            { label: 'Pendientes', value: data.questionStatus.pending,   color: '#fbbf24' },
            { label: 'Rechazadas', value: data.questionStatus.rejected,  color: '#f87171' },
          ]} />
        </ChartCard>
        <ChartCard title="Progreso de estudiantes">
          <VBarChart
            items={data.progressDistribution.map((d, i) => ({
              label: d.label,
              value: d.count,
              color: ['#475569', '#818cf8', '#6366f1', '#34d399'][i],
            }))}
          />
        </ChartCard>
      </div>

      {data.levelCompletion.length > 0 && (
        <ChartCard title="Completación por nivel (% de estudiantes)">
          <HBarList
            items={data.levelCompletion.map((l) => ({ label: l.levelName, value: l.pct, suffix: '%' }))}
            max={100}
          />
        </ChartCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.groupComparison.length > 0 && (
          <ChartCard title="Comparativa por grupo (XP promedio)">
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
            <TopStudentsTable students={data.topStudents} showGroup />
          </ChartCard>
        )}
      </div>
    </div>
  )
}
