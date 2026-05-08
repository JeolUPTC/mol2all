import { useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import { teacherService } from '../services/teacher.service'
import { QuestionEditor } from '../components/QuestionEditor'
import type { QuestionEditorInitialValues } from '../components/QuestionEditor'
import { chemFormat } from '../../game/utils/chemFormat'
import { useAuthStore } from '@stores/authStore'
import type {
  TeacherGroup, GroupStudent, UnassignedStudent,
  ProgressWithLevel, TeacherQuestion, QuestionDraft, BankQuestion, TeacherAnalytics,
} from '../services/teacher.service'
import { HBarList, VBarChart } from '@shared/components/ui/Charts'

type Tab = 'groups' | 'stats' | 'bank'

const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar', balancing: 'Balanceo',
  stoichiometry: 'Estequiometría', limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento', mixed: 'Mixto',
}
const STATUS_LABELS = {
  PENDING:  { label: 'Pendiente', cls: 'bg-amber-900/50 text-amber-300' },
  APPROVED: { label: 'Aprobada',  cls: 'bg-emerald-900/50 text-emerald-300' },
  REJECTED: { label: 'Rechazada', cls: 'bg-red-900/50 text-red-400' },
}

const TYPE_SHORT: Record<string, string> = {
  MULTIPLE_CHOICE:  'Opción múltiple',
  NUMERIC_INPUT:    'Numérica',
  EQUATION_BALANCE: 'Ecuación',
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>('groups')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Panel Docente</h1>

      <div className="flex gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {([
          ['groups', 'Mis Grupos'],
          ['stats',  'Estadísticas'],
          ['bank',   'Banco de Preguntas'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'groups' && <GroupsTab />}
      {tab === 'stats'  && <StatsTab />}
      {tab === 'bank'   && <BankTab />}
    </div>
  )
}

// ── Groups tab ────────────────────────────────────────────────────────────────

function GroupsTab() {
  const [groups, setGroups]         = useState<TeacherGroup[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedGroup, setSelected] = useState<TeacherGroup | null>(null)

  useEffect(() => {
    teacherService.getMyGroups()
      .then((gs) => { setGroups(gs); if (gs.length === 1) setSelected(gs[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton rows={3} />

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-game-border bg-game-surface p-12 text-center">
        <p className="text-slate-400">No tienes grupos asignados.</p>
        <p className="mt-1 text-sm text-slate-500">El administrador debe crear y asignarte un grupo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Group selector */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button key={g.id} onClick={() => setSelected(g)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                selectedGroup?.id === g.id
                  ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                  : 'border-game-border bg-game-surface text-slate-400 hover:text-slate-200'
              }`}>
              {g.name}
              <span className="ml-2 text-xs text-slate-500">{g._count.students} est.</span>
            </button>
          ))}
        </div>
      )}

      {selectedGroup ? (
        <GroupDetail group={selectedGroup} onStudentAdded={(count) =>
          setGroups((prev) => prev.map((g) =>
            g.id === selectedGroup.id ? { ...g, _count: { students: count } } : g
          ))
        } />
      ) : (
        <div className="rounded-xl border border-game-border bg-game-surface p-8 text-center">
          <p className="text-sm text-slate-400">Selecciona un grupo para ver sus estudiantes.</p>
        </div>
      )}
    </div>
  )
}

function GroupDetail({ group, onStudentAdded }: {
  group: TeacherGroup
  onStudentAdded: (count: number) => void
}) {
  const [students, setStudents]         = useState<GroupStudent[]>([])
  const [unassigned, setUnassigned]     = useState<UnassignedStudent[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<GroupStudent | null>(null)
  const [progress, setProgress]         = useState<ProgressWithLevel[]>([])
  const [loadingProg, setLoadingProg]   = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [showAssign, setShowAssign]     = useState(false)
  const [assignId, setAssignId]         = useState('')
  const [assigning, setAssigning]       = useState(false)
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState('')
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [resetting, setResetting]       = useState(false)
  const [downloading, setDownloading]   = useState(false)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    Promise.all([
      teacherService.getGroupStudents(group.id),
      teacherService.getUnassignedStudents(),
    ])
      .then(([s, u]) => { setStudents(s); setUnassigned(u) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [group.id])

  const openStudent = async (s: GroupStudent) => {
    setSelected(s); setLoadingProg(true)
    try { setProgress(await teacherService.getStudentProgress(s.id)) }
    catch { setProgress([]) }
    finally { setLoadingProg(false) }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!form.email || !form.username || !form.displayName || !form.password) {
      setCreateError('Todos los campos son obligatorios.')
      return
    }
    setCreating(true)
    try {
      await teacherService.createStudent({ ...form, groupId: group.id })
      const updated = await teacherService.getGroupStudents(group.id)
      setStudents(updated)
      onStudentAdded(updated.length)
      setForm({ email: '', username: '', displayName: '', password: '' })
      setShowCreate(false)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? 'No se pudo crear el estudiante.')
    } finally { setCreating(false) }
  }

  const handleAssign = async () => {
    if (!assignId) return
    setAssigning(true)
    try {
      await teacherService.assignStudent(group.id, assignId)
      const [updated, newUnassigned] = await Promise.all([
        teacherService.getGroupStudents(group.id),
        teacherService.getUnassignedStudents(),
      ])
      setStudents(updated)
      setUnassigned(newUnassigned)
      onStudentAdded(updated.length)
      setAssignId('')
      setShowAssign(false)
    } catch { /* silencioso */ }
    finally { setAssigning(false) }
  }

  const handleRemove = async (studentId: string) => {
    try {
      await teacherService.removeStudent(group.id, studentId)
      const updated = await teacherService.getGroupStudents(group.id)
      setStudents(updated)
      onStudentAdded(updated.length)
      if (selected?.id === studentId) setSelected(null)
      const u = await teacherService.getUnassignedStudents()
      setUnassigned(u)
    } catch { /* silencioso */ }
  }

  const handleReset = async (studentId: string) => {
    setResetting(true)
    try {
      await teacherService.resetStudentProgress(studentId)
      if (selected?.id === studentId) {
        setProgress(await teacherService.getStudentProgress(studentId))
      }
      setResetConfirm(null)
    } catch { /* silencioso */ }
    finally { setResetting(false) }
  }

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      const res = await apiClient.get(ENDPOINTS.teacher.reportCsv, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${group.name.replace(/\s/g, '_')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silencioso */ }
    finally { setDownloading(false) }
  }

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-100">{group.name}</h2>
          {group.description && <p className="text-sm text-slate-400">{group.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssign((v) => !v)}
            className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:text-white">
            {showAssign ? 'Cancelar' : 'Asignar estudiante existente'}
          </button>
          <button onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-500">
            {showCreate ? 'Cancelar' : '+ Nuevo estudiante'}
          </button>
          <button onClick={downloadCsv} disabled={downloading}
            className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50">
            {downloading ? '…' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Create student form */}
      {showCreate && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nuevo estudiante — {group.name}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['displayName', 'username', 'email', 'password'] as const).map((f) => (
              <div key={f} className="space-y-1">
                <label className="block text-xs text-slate-400">
                  {f === 'displayName' ? 'Nombre completo' : f === 'username' ? 'Usuario' : f === 'email' ? 'Correo' : 'Contraseña temporal'}
                </label>
                <input
                  type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'}
                  value={form[f]}
                  onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          {createError && <p className="text-xs text-red-400">{createError}</p>}
          <button onClick={handleCreate} disabled={creating}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50">
            {creating ? 'Creando…' : 'Crear y asignar al grupo'}
          </button>
        </div>
      )}

      {/* Assign existing student */}
      {showAssign && (
        <div className="card flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="block text-xs text-slate-400">Estudiante sin grupo</label>
            <select value={assignId} onChange={(e) => setAssignId(e.target.value)}
              className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none">
              <option value="">— Seleccionar —</option>
              {unassigned.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.profile?.displayName ?? u.username} (@{u.username})
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleAssign} disabled={assigning || !assignId}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
            {assigning ? '…' : 'Asignar'}
          </button>
        </div>
      )}

      {/* Students list + detail panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="card overflow-hidden p-0 lg:col-span-1">
          <div className="border-b border-game-border px-4 py-2">
            <span className="text-xs text-slate-500">{students.length} estudiantes</span>
          </div>
          {students.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No hay estudiantes en este grupo aún.
            </p>
          ) : (
            <ul>
              {students.map((s) => (
                <li key={s.id}
                  className={`flex cursor-pointer items-center justify-between border-b border-game-border/50 px-4 py-3 transition-colors hover:bg-slate-800/40 ${
                    selected?.id === s.id ? 'bg-slate-800/60' : ''
                  }`}
                  onClick={() => openStudent(s)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {s.profile?.displayName ?? s.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s._count.progress} niveles · {s.profile?.totalXp ?? 0} XP
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(s.id) }}
                    title="Quitar del grupo"
                    className="ml-2 flex-shrink-0 rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-red-900/30 hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <StudentDetail
              student={selected}
              progress={progress}
              loading={loadingProg}
              resetConfirm={resetConfirm}
              resetting={resetting}
              onResetRequest={(id) => setResetConfirm(id)}
              onResetCancel={() => setResetConfirm(null)}
              onResetConfirm={handleReset}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-game-border bg-game-surface">
              <p className="text-sm text-slate-500">Selecciona un estudiante para ver su detalle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StudentDetail({ student, progress, loading, resetConfirm, resetting, onResetRequest, onResetCancel, onResetConfirm }: {
  student: GroupStudent
  progress: ProgressWithLevel[]
  loading: boolean
  resetConfirm: string | null
  resetting: boolean
  onResetRequest: (id: string) => void
  onResetCancel: () => void
  onResetConfirm: (id: string) => void
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-slate-100">
            {student.profile?.displayName ?? student.username}
          </p>
          <p className="text-sm text-slate-400">{student.email}</p>
          <div className="mt-1 flex gap-3 text-sm">
            <span className="text-game-xp">{student.profile?.totalXp ?? 0} XP</span>
            <span className="text-game-coins">{student.profile?.totalCoins ?? 0} monedas</span>
          </div>
        </div>
        <div>
          {resetConfirm === student.id ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400">¿Confirmar reset?</span>
              <button onClick={() => onResetConfirm(student.id)} disabled={resetting}
                className="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {resetting ? '…' : 'Sí'}
              </button>
              <button onClick={onResetCancel}
                className="rounded border border-game-border px-2 py-1 text-xs text-slate-400 hover:text-slate-200">
                No
              </button>
            </div>
          ) : (
            <button onClick={() => onResetRequest(student.id)}
              className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/40">
              Reiniciar progreso
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : progress.length === 0 ? (
        <p className="text-sm text-slate-500">Sin progreso registrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Nivel</th>
                <th className="pb-2 text-center">Estado</th>
                <th className="pb-2 text-right">⭐</th>
                <th className="pb-2 text-right">Mejor</th>
                <th className="pb-2 text-right">Intentos</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => (
                <tr key={p.id} className="border-b border-game-border/30">
                  <td className="py-1.5 font-medium text-slate-200">{p.level.name}</td>
                  <td className="py-1.5 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      p.status === 'COMPLETED' ? 'bg-emerald-900/50 text-emerald-400'
                      : p.status === 'IN_PROGRESS' ? 'bg-sky-900/50 text-sky-400'
                      : 'bg-slate-800 text-slate-500'
                    }`}>
                      {p.status === 'COMPLETED' ? 'Completado' : p.status === 'IN_PROGRESS' ? 'En progreso' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-amber-400">{p.stars > 0 ? '★'.repeat(p.stars) : '—'}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-300">{p.highScore}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-400">{p.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

const T_GROUP_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b']

function StatsTab() {
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
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TStatCard label="Mis estudiantes"  value={kpis.totalStudents}    color="text-sky-400" />
        <TStatCard label="XP promedio"      value={kpis.avgXp}            color="text-game-xp" />
        <TStatCard label="Niveles promedio" value={kpis.avgLevels}        color="text-emerald-400" />
        <TStatCard
          label="Alumnos activos"
          value={kpis.activeStudentPct}
          color={pctColor(kpis.activeStudentPct)}
          suffix="%"
        />
      </div>

      {/* Completación por nivel + estrellas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TChartCard title="Completación por nivel (% de mis alumnos)">
          {data.levelCompletion.length > 0
            ? <HBarList
                items={data.levelCompletion.map((l) => ({ label: l.levelName, value: l.pct, suffix: '%' }))}
                max={100}
              />
            : <p className="text-sm text-slate-500">Sin datos de progreso aún.</p>
          }
        </TChartCard>
        <TChartCard title="Distribución de estrellas">
          <VBarChart
            items={data.starsDistribution.map((s) => ({
              label: '★'.repeat(s.stars),
              value: s.count,
              color: s.stars === 3 ? '#34d399' : s.stars === 2 ? '#fbbf24' : '#94a3b8',
            }))}
          />
        </TChartCard>
      </div>

      {/* Comparativa grupos + top estudiantes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.groupComparison.length > 1 && (
          <TChartCard title="Comparativa entre grupos (XP promedio)">
            <VBarChart
              height={140}
              items={data.groupComparison.map((g, i) => ({
                label: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
                value: g.avgXp,
                color: T_GROUP_COLORS[i % T_GROUP_COLORS.length],
              }))}
            />
          </TChartCard>
        )}
        {data.topStudents.length > 0 && (
          <TChartCard title="Top 5 estudiantes">
            <TTopStudents students={data.topStudents} showGroup={data.groupComparison.length > 1} />
          </TChartCard>
        )}
      </div>
    </div>
  )
}

function TStatCard({ label, value, color, suffix = '' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="card space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}{suffix}</p>
    </div>
  )
}

function TChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

function TTopStudents({
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

// ── Bank tab ──────────────────────────────────────────────────────────────────

function BankTab() {
  const user = useAuthStore((s) => s.user)
  const [subTab, setSubTab] = useState<'bank' | 'new' | 'mine'>('bank')

  // Bank state
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([])
  const [loadingBank, setLoadingBank]     = useState(false)
  const [topicFilter, setTopicFilter]     = useState('ALL')
  const [search, setSearch]               = useState('')
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null)
  const [updating, setUpdating]           = useState(false)
  const [bankExpandedId, setBankExpandedId] = useState<string | null>(null)

  // My questions state
  const [myQuestions, setMyQuestions] = useState<TeacherQuestion[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  // New question state
  const [submitting, setSubmitting] = useState(false)

  const loadBank = async () => {
    setLoadingBank(true)
    try { setBankQuestions(await teacherService.getBankQuestions()) }
    catch { /* silencioso */ }
    finally { setLoadingBank(false) }
  }

  const loadMine = async () => {
    setLoadingMine(true)
    try { setMyQuestions(await teacherService.getMyQuestions()) }
    catch { /* silencioso */ }
    finally { setLoadingMine(false) }
  }

  useEffect(() => {
    if (subTab === 'bank') loadBank()
    if (subTab === 'mine') loadMine()
  }, [subTab])

  const handleSubmit = async (draft: QuestionDraft) => {
    setSubmitting(true)
    try { await teacherService.createQuestion(draft) }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async (draft: QuestionDraft) => {
    if (!editingQuestion) return
    setUpdating(true)
    try {
      const updated = await teacherService.updateQuestion(editingQuestion.id, draft)
      setBankQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q))
      setEditingQuestion(null)
    } finally {
      setUpdating(false)
    }
  }

  const topics   = ['ALL', ...Array.from(new Set(bankQuestions.map((q) => q.topic)))]
  const filtered = bankQuestions
    .filter((q) => topicFilter === 'ALL' || q.topic === topicFilter)
    .filter((q) => !search || q.stem.toLowerCase().includes(search.toLowerCase()))

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (editingQuestion) {
    const iv: QuestionEditorInitialValues = {
      type:          editingQuestion.type,
      topic:         editingQuestion.topic,
      difficulty:    editingQuestion.difficulty,
      stem:          editingQuestion.stem,
      explanation:   editingQuestion.explanation,
      options:       editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingQuestion(null)}
            className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            ← Volver al banco
          </button>
          <h2 className="font-display text-lg font-semibold text-slate-100">Editar pregunta</h2>
        </div>
        <div className="card">
          <QuestionEditor
            key={editingQuestion.id}
            onSubmit={handleUpdate}
            submitting={updating}
            submitLabel="Guardar cambios"
            successMessage="Pregunta actualizada correctamente."
            hideNote
            initialValues={iv}
          />
        </div>
      </div>
    )
  }

  // ── Normal view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {([
          ['bank', 'Banco'],
          ['new',  'Nueva pregunta'],
          ['mine', `Mis envíos${myQuestions.length > 0 ? ` (${myQuestions.length})` : ''}`],
        ] as ['bank' | 'new' | 'mine', string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              subTab === key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Bank ──────────────────────────────────────────────────────────── */}
      {subTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por enunciado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {topics.map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    topicFilter === t ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                  {t === 'ALL' ? 'Todos' : TOPIC_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          </div>

          {loadingBank ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2">Pregunta</th>
                      <th className="px-4 py-2">Tema</th>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2 text-center">Dif.</th>
                      <th className="px-4 py-2">Autor</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => {
                      const isOpen = bankExpandedId === q.id
                      const toggle = () => setBankExpandedId(isOpen ? null : q.id)
                      return (
                        <>
                          <tr
                            key={q.id}
                            onClick={toggle}
                            className={`cursor-pointer border-b border-game-border/50 hover:bg-slate-800/30 ${isOpen ? 'bg-slate-800/40' : ''}`}
                          >
                            <td className="max-w-xs px-4 py-2">
                              <p className="truncate text-xs text-slate-200">{chemFormat(q.stem)}</p>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-400">{TOPIC_LABELS[q.topic] ?? q.topic}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{TYPE_SHORT[q.type] ?? q.type}</td>
                            <td className="px-4 py-2 text-center text-xs text-amber-500">
                              {'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-500">
                              {q.author?.profile?.displayName ?? q.author?.username ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {q.authorId === user?.id && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingQuestion(q) }}
                                    className="rounded border border-sky-800/50 bg-sky-900/20 px-2 py-1 text-xs text-sky-400 hover:bg-sky-900/40"
                                  >
                                    Editar
                                  </button>
                                )}
                                <span className={`text-xs ${isOpen ? 'text-brand-400' : 'text-slate-500'}`}>{isOpen ? '▲' : '▼'}</span>
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr key={`${q.id}-detail`} className="border-b border-game-border/50 bg-slate-900/60">
                              <td colSpan={6} className="px-6 py-4">
                                <BankQuestionDetail question={q} />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                          {bankQuestions.length === 0
                            ? 'No hay preguntas aprobadas en el banco aún.'
                            : 'Sin resultados para este filtro.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── New question ───────────────────────────────────────────────────── */}
      {subTab === 'new' && (
        <div className="card">
          <QuestionEditor onSubmit={handleSubmit} submitting={submitting} />
        </div>
      )}

      {/* ── My submissions ─────────────────────────────────────────────────── */}
      {subTab === 'mine' && (
        <div className="space-y-3">
          {loadingMine ? (
            <LoadingSkeleton rows={3} />
          ) : myQuestions.length === 0 ? (
            <div className="rounded-xl border border-game-border bg-game-surface p-8 text-center">
              <p className="text-sm text-slate-500">No has enviado preguntas aún.</p>
            </div>
          ) : (
            myQuestions.map((q) => {
              const st = STATUS_LABELS[q.status] ?? STATUS_LABELS.PENDING
              return (
                <div key={q.id} className="card overflow-hidden p-0">
                  <div
                    className="flex cursor-pointer items-start gap-3 px-4 py-3"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                        <span>{TOPIC_LABELS[q.topic] ?? q.topic}</span>
                        <span>{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-200">{chemFormat(q.stem)}</p>
                      {q.reviewNote && (
                        <p className="mt-1 text-xs text-amber-400">Nota: {q.reviewNote}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{expandedId === q.id ? '▲' : '▼'}</span>
                  </div>
                  {expandedId === q.id && q.options && (
                    <div className="space-y-1 border-t border-game-border/50 px-4 pb-3 pt-2">
                      {(q.options as { id: string; text: string }[]).map((opt) => {
                        const correct = q.type !== 'NUMERIC_INPUT'
                          ? (q.correctAnswer as { id: string }).id === opt.id
                          : false
                        return (
                          <div key={opt.id} className={`rounded px-3 py-1.5 text-sm ${
                            correct
                              ? 'border border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                              : 'border border-slate-700/40 text-slate-400'
                          }`}>
                            <span className="mr-1.5 font-semibold">{opt.id.toUpperCase()}.</span>
                            {chemFormat(opt.text)}
                            {correct && <span className="ml-1.5 text-xs">✓</span>}
                          </div>
                        )
                      })}
                      {q.explanation && (
                        <p className="pt-1 text-xs text-slate-400">
                          <span className="text-slate-500">Explicación:</span>{' '}
                          {chemFormat(q.explanation)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function BankQuestionDetail({ question: q }: { question: BankQuestion }) {
  const isMC = q.type === 'MULTIPLE_CHOICE' || q.type === 'EQUATION_BALANCE'
  const isNumeric = q.type === 'NUMERIC_INPUT'
  const correctId = isMC && q.correctAnswer && 'id' in (q.correctAnswer as object)
    ? (q.correctAnswer as { id: string }).id
    : null
  const numAnswer = isNumeric && q.correctAnswer && 'value' in (q.correctAnswer as object)
    ? (q.correctAnswer as { value: number; tolerance: number })
    : null

  return (
    <div className="space-y-3">
      {/* Stem */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Enunciado</p>
        <p className="text-sm leading-relaxed text-slate-200">{chemFormat(q.stem)}</p>
      </div>

      {/* Options */}
      {isMC && q.options && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Opciones</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {(q.options as { id: string; text: string }[]).map((opt) => {
              const isCorrect = opt.id === correctId
              return (
                <div key={opt.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isCorrect
                    ? 'border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                    : 'border-slate-700/40 text-slate-400'
                }`}>
                  <span className={`flex-shrink-0 font-bold ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {opt.id.toUpperCase()}.
                  </span>
                  <span>{chemFormat(opt.text)}</span>
                  {isCorrect && <span className="ml-auto flex-shrink-0 text-xs text-emerald-500">✓ Correcta</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Numeric answer */}
      {isNumeric && numAnswer && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Respuesta numérica</p>
          <p className="text-sm text-emerald-300">
            {numAnswer.value}
            {numAnswer.tolerance > 0 && (
              <span className="text-slate-400"> ± {numAnswer.tolerance}</span>
            )}
          </p>
        </div>
      )}

      {/* Explanation */}
      {q.explanation && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Explicación</p>
          <p className="text-sm text-slate-300">{chemFormat(q.explanation)}</p>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-game-surface" />
      ))}
    </div>
  )
}
