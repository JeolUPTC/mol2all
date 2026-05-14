import type { ReactNode } from 'react'
import type { AdminUser } from '../../services/admin.service'

export const ROLE_LABELS: Record<AdminUser['role'], string> = {
  STUDENT: 'Estudiante', TEACHER: 'Docente', ADMIN: 'Admin',
}
export const ROLE_COLORS: Record<AdminUser['role'], string> = {
  STUDENT: 'bg-sky-900 text-sky-300',
  TEACHER: 'bg-violet-900 text-violet-300',
  ADMIN:   'bg-amber-900 text-amber-300',
}
export const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar', balancing: 'Balanceo',
  stoichiometry: 'Estequiometría', limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento', mixed: 'Mixto',
}
export const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Selección múltiple', NUMERIC_INPUT: 'Numérica',
  EQUATION_BALANCE: 'Ecuación balanceada',
}

export function StatCard({ label, value, color, suffix = '' }: {
  label: string; value: number; color: string; suffix?: string
}) {
  return (
    <div className="card space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}{suffix}</p>
    </div>
  )
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

export function TopStudentsTable({
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
            <p className="text-sm font-semibold text-game-xp tabular-nums">{s.totalXp} XP</p>
            <p className="text-xs text-slate-500">{s.levelsCompleted} niveles</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-game-surface" />
      ))}
    </div>
  )
}

export function ErrorMsg() {
  return <p className="text-center text-sm text-slate-500">No se pudieron cargar los datos.</p>
}
