import { useEffect, useState, type ReactNode } from 'react'
import { adminService } from '../services/admin.service'
import { chemFormat } from '../../game/utils/chemFormat'
import { QuestionEditor } from '../../teacher/components/QuestionEditor'
import type { QuestionEditorInitialValues } from '../../teacher/components/QuestionEditor'
import type {
  AdminUser, AdminGroup, AdminTeacher,
  AdminLevel, PendingQuestion, ApprovedQuestion,
  GroupStudent, AdminUnassignedStudent, AdminAnalytics,
} from '../services/admin.service'
import type { QuestionDraft } from '../../teacher/services/teacher.service'
import { DonutChart, HBarList, VBarChart } from '@shared/components/ui/Charts'

type Tab = 'stats' | 'users' | 'groups' | 'levels' | 'review' | 'bank' | 'system'

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  STUDENT: 'Estudiante', TEACHER: 'Docente', ADMIN: 'Admin',
}
const ROLE_COLORS: Record<AdminUser['role'], string> = {
  STUDENT: 'bg-sky-900 text-sky-300',
  TEACHER: 'bg-violet-900 text-violet-300',
  ADMIN:   'bg-amber-900 text-amber-300',
}
const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar', balancing: 'Balanceo',
  stoichiometry: 'Estequiometría', limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento', mixed: 'Mixto',
}
const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Selección múltiple', NUMERIC_INPUT: 'Numérica',
  EQUATION_BALANCE: 'Ecuación balanceada',
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('stats')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    adminService.getPendingQuestions()
      .then((qs) => setPendingCount(qs.filter((q) => q.status === 'PENDING').length))
      .catch(() => {})
  }, [])

  const tabs: [Tab, string][] = [
    ['stats',  'Resumen'],
    ['users',  'Usuarios'],
    ['groups', 'Grupos'],
    ['levels', 'Niveles'],
    ['review', pendingCount > 0 ? `Revisión (${pendingCount})` : 'Revisión'],
    ['bank',   'Banco'],
    ['system', 'Sistema'],
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Administración</h1>

      <div className="flex flex-wrap gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {tabs.map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-brand-600 text-white'
                : t === 'review' && pendingCount > 0
                ? 'text-amber-400 hover:text-amber-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'stats'  && <StatsTab />}
      {tab === 'users'  && <UsersTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'levels' && <LevelsTab />}
      {tab === 'review' && <ReviewTab onCountChange={setPendingCount} />}
      {tab === 'bank'   && <BankTab />}
      {tab === 'system' && <SystemTab />}
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const GROUP_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#f87171']

function StatsTab() {
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
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Estudiantes"      value={data.kpis.totalStudents}    color="text-sky-400" />
        <StatCard label="Docentes"         value={data.kpis.totalTeachers}    color="text-violet-400" />
        <StatCard label="Grupos activos"   value={data.kpis.totalGroups}      color="text-brand-400" />
        <StatCard label="Niveles superados" value={data.kpis.completedLevels} color="text-emerald-400" />
        <StatCard
          label="Alumnos activos"
          value={data.kpis.activeStudentPct}
          color={pctColor(data.kpis.activeStudentPct)}
          suffix="%"
        />
      </div>

      {/* Banco de preguntas + distribución de progreso */}
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

      {/* Completación por nivel */}
      {data.levelCompletion.length > 0 && (
        <ChartCard title="Completación por nivel (% de estudiantes)">
          <HBarList
            items={data.levelCompletion.map((l) => ({ label: l.levelName, value: l.pct, suffix: '%' }))}
            max={100}
          />
        </ChartCard>
      )}

      {/* Comparativa grupos + top estudiantes */}
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

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      {children}
    </div>
  )
}

function TopStudentsTable({
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

// ── Users ─────────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]     = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | AdminUser['role']>('ALL')
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    adminService.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleActive = async (user: AdminUser) => {
    if (pending.has(user.id)) return
    setPending((s) => new Set(s).add(user.id))
    try {
      const updated = await adminService.updateUser(user.id, { isActive: !user.isActive })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    } catch { /* silencioso */ }
    finally { setPending((s) => { const n = new Set(s); n.delete(user.id); return n }) }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!form.email || !form.username || !form.displayName || !form.password) {
      setCreateError('Todos los campos son obligatorios.')
      return
    }
    setCreating(true)
    try {
      const newUser = await adminService.createTeacher(form)
      setUsers((prev) => [newUser as AdminUser, ...prev])
      setForm({ email: '', username: '', displayName: '', password: '' })
      setShowCreate(false)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? 'No se pudo crear el docente.')
    } finally { setCreating(false) }
  }

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  if (loading) return <LoadingSkeleton rows={5} />

  return (
    <div className="space-y-4">
      {/* Create teacher */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Crear docente</h2>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="text-xs text-brand-400 hover:text-brand-300"
          >
            {showCreate ? 'Cancelar ▲' : '+ Nuevo docente'}
          </button>
        </div>
        {showCreate && (
          <div className="space-y-3">
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
            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {creating ? 'Creando…' : 'Crear docente'}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-game-border px-4 py-3">
          <div className="flex gap-1">
            {(['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'ALL' ? 'Todos' : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Grupo</th>
                <th className="px-4 py-2 text-right">XP</th>
                <th className="px-4 py-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2 font-medium text-slate-200">
                    {u.profile?.displayName ?? u.username}
                  </td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-400">
                    {u.role === 'STUDENT'
                      ? (u.group?.name ?? <span className="text-slate-600">Sin grupo</span>)
                      : u.teacherGroups.length > 0
                      ? u.teacherGroups.map((g) => g.name).join(', ')
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-game-xp">
                    {u.profile?.totalXp ?? 0}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={pending.has(u.id)}
                      className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
                        u.isActive
                          ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                          : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                      }`}
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Groups ────────────────────────────────────────────────────────────────────

function GroupsTab() {
  const [groups, setGroups]     = useState<AdminGroup[]>([])
  const [teachers, setTeachers] = useState<AdminTeacher[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', teacherId: '' })
  const [creating, setCreating] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null)

  // Student management
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null)
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([])
  const [unassigned, setUnassigned] = useState<AdminUnassignedStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [assignId, setAssignId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([adminService.getGroups(), adminService.getTeachers()])
      .then(([g, t]) => { setGroups(g); setTeachers(t) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const g = await adminService.createGroup({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        teacherId: form.teacherId || undefined,
      })
      setGroups((prev) => [...prev, g])
      setForm({ name: '', description: '', teacherId: '' })
      setShowCreate(false)
    } catch { /* silencioso */ }
    finally { setCreating(false) }
  }

  const handleTeacherChange = async (groupId: string, teacherId: string) => {
    try {
      const updated = await adminService.updateGroup(groupId, { teacherId: teacherId || null })
      setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...updated } : g)))
    } catch { /* silencioso */ }
    finally { setEditingTeacher(null) }
  }

  const toggleGroupActive = async (group: AdminGroup) => {
    try {
      const updated = await adminService.updateGroup(group.id, { isActive: !group.isActive })
      setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, ...updated } : g)))
    } catch { /* silencioso */ }
  }

  const openManage = async (groupId: string) => {
    if (managingGroupId === groupId) { setManagingGroupId(null); return }
    setManagingGroupId(groupId)
    setAssignId('')
    setLoadingStudents(true)
    try {
      const [students, unassignedList] = await Promise.all([
        adminService.getGroupStudents(groupId),
        adminService.getUnassignedStudents(),
      ])
      setGroupStudents(students)
      setUnassigned(unassignedList)
    } catch { /* silencioso */ }
    finally { setLoadingStudents(false) }
  }

  const handleAssign = async () => {
    if (!assignId || !managingGroupId) return
    setAssigning(true)
    try {
      await adminService.assignStudent(managingGroupId, assignId)
      const [students, unassignedList] = await Promise.all([
        adminService.getGroupStudents(managingGroupId),
        adminService.getUnassignedStudents(),
      ])
      setGroupStudents(students)
      setUnassigned(unassignedList)
      setAssignId('')
      setGroups((prev) => prev.map((g) =>
        g.id === managingGroupId ? { ...g, _count: { students: students.length } } : g,
      ))
    } catch { /* silencioso */ }
    finally { setAssigning(false) }
  }

  const handleRemove = async (studentId: string) => {
    if (!managingGroupId) return
    setRemovingId(studentId)
    try {
      await adminService.removeStudent(managingGroupId, studentId)
      const removed = groupStudents.find((s) => s.id === studentId)
      setGroupStudents((prev) => prev.filter((s) => s.id !== studentId))
      if (removed) {
        setUnassigned((prev) => [...prev, { id: removed.id, username: removed.username, profile: removed.profile }])
      }
      setGroups((prev) => prev.map((g) =>
        g.id === managingGroupId ? { ...g, _count: { students: g._count.students - 1 } } : g,
      ))
    } catch { /* silencioso */ }
    finally { setRemovingId(null) }
  }

  const managingGroup = groups.find((g) => g.id === managingGroupId)

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="space-y-4">
      {/* Create group */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Crear grupo</h2>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="text-xs text-brand-400 hover:text-brand-300"
          >
            {showCreate ? 'Cancelar ▲' : '+ Nuevo grupo'}
          </button>
        </div>
        {showCreate && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Nombre del grupo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Química 10°A"
                  className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-400">Docente asignado</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">— Sin asignar —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profile?.displayName ?? t.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {creating ? 'Creando…' : 'Crear grupo'}
            </button>
          </div>
        )}
      </div>

      {/* Groups list */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Grupo</th>
                <th className="px-4 py-2">Docente</th>
                <th className="px-4 py-2 text-right">Estudiantes</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-center">Gestionar</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-200">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-slate-500">{g.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingTeacher === g.id ? (
                      <select
                        autoFocus
                        defaultValue={g.teacherId ?? ''}
                        onBlur={(e) => handleTeacherChange(g.id, e.target.value)}
                        onChange={(e) => handleTeacherChange(g.id, e.target.value)}
                        className="rounded border border-brand-500 bg-slate-700 px-2 py-1 text-sm text-slate-200 focus:outline-none"
                      >
                        <option value="">— Sin asignar —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.profile?.displayName ?? t.username}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingTeacher(g.id)}
                        title="Clic para cambiar docente"
                        className="text-slate-300 underline decoration-dotted hover:text-white"
                      >
                        {g.teacher?.profile?.displayName ?? g.teacher?.username ?? (
                          <span className="text-slate-500 no-underline">Sin asignar</span>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-sky-400">
                    {g._count.students}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleGroupActive(g)}
                      className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all ${
                        g.isActive
                          ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                          : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                      }`}
                    >
                      {g.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => openManage(g.id)}
                      className={`text-xs font-medium transition-colors ${
                        managingGroupId === g.id
                          ? 'text-brand-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {managingGroupId === g.id ? 'Cerrar ▲' : 'Estudiantes ▼'}
                    </button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No hay grupos creados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student management panel */}
      {managingGroupId && managingGroup && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Estudiantes — <span className="text-slate-100">{managingGroup.name}</span>
          </h2>

          {/* Assign student */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs text-slate-400">Asignar estudiante sin grupo</label>
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="">— Seleccionar —</option>
                {unassigned.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.profile?.displayName ?? u.username} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAssign}
              disabled={assigning || !assignId}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {assigning ? '…' : 'Asignar'}
            </button>
          </div>

          {/* Student list */}
          {loadingStudents ? (
            <LoadingSkeleton rows={3} />
          ) : groupStudents.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Este grupo no tiene estudiantes aún.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-game-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Estudiante</th>
                    <th className="px-4 py-2 text-right">XP</th>
                    <th className="px-4 py-2 text-right">Niveles</th>
                    <th className="px-4 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStudents.map((s) => (
                    <tr key={s.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                      <td className="px-4 py-2">
                        <p className="font-medium text-slate-200">{s.profile?.displayName ?? s.username}</p>
                        <p className="text-xs text-slate-500">@{s.username}</p>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-game-xp">
                        {s.profile?.totalXp ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-400">
                        {s._count.progress}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemove(s.id)}
                          disabled={removingId === s.id}
                          className="rounded px-2 py-0.5 text-xs font-medium text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                        >
                          {removingId === s.id ? '…' : 'Quitar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Levels ────────────────────────────────────────────────────────────────────

function LevelsTab() {
  const [levels, setLevels]    = useState<AdminLevel[]>([])
  const [loading, setLoading]  = useState(true)
  const [editing, setEditing]  = useState<{
    id: string; field: 'xpReward' | 'coinsReward'; value: string
  } | null>(null)

  useEffect(() => {
    adminService.getLevels().then(setLevels).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleActive = async (level: AdminLevel) => {
    try {
      const updated = await adminService.updateLevel(level.id, { isActive: !level.isActive })
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
    } catch { /* silencioso */ }
  }

  const saveEdit = async () => {
    if (!editing) return
    const num = parseInt(editing.value, 10)
    if (isNaN(num) || num < 0) { setEditing(null); return }
    try {
      const updated = await adminService.updateLevel(editing.id, { [editing.field]: num })
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
    } catch { /* silencioso */ }
    finally { setEditing(null) }
  }

  const renderEditable = (level: AdminLevel, field: 'xpReward' | 'coinsReward') => {
    const isEditingThis = editing?.id === level.id && editing.field === field
    if (isEditingThis) {
      return (
        <input
          type="number" min={0} autoFocus value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={saveEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null) }}
          className="w-20 rounded border border-brand-500 bg-slate-700 px-2 py-0.5 text-right tabular-nums text-slate-100 focus:outline-none"
        />
      )
    }
    return (
      <button
        onClick={() => setEditing({ id: level.id, field, value: String(level[field]) })}
        title="Clic para editar"
        className="tabular-nums text-slate-200 underline decoration-dotted hover:text-white"
      >
        {level[field]}
      </button>
    )
  }

  if (loading) return <LoadingSkeleton rows={5} />

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tema</th>
              <th className="px-4 py-2 text-right">XP</th>
              <th className="px-4 py-2 text-right">Monedas</th>
              <th className="px-4 py-2 text-right">Completados</th>
              <th className="px-4 py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                <td className="px-4 py-2 text-slate-500">{l.order}</td>
                <td className="px-4 py-2 font-medium text-slate-200">{l.name}</td>
                <td className="px-4 py-2 text-slate-400">{TOPIC_LABELS[l.topic] ?? l.topic}</td>
                <td className="px-4 py-2 text-right text-game-xp">{renderEditable(l, 'xpReward')}</td>
                <td className="px-4 py-2 text-right text-game-coins">{renderEditable(l, 'coinsReward')}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-400">{l._count.progress}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleActive(l)}
                    className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all ${
                      l.isActive
                        ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                        : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                    }`}
                  >
                    {l.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Review tab ────────────────────────────────────────────────────────────────

function ReviewTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [questions, setQuestions] = useState<PendingQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [reviewingId, setRevId]   = useState<string | null>(null)
  const [noteText, setNoteText]   = useState<Record<string, string>>({})

  useEffect(() => {
    adminService.getPendingQuestions()
      .then((qs) => {
        setQuestions(qs)
        onCountChange(qs.filter((q) => q.status === 'PENDING').length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [onCountChange])

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setRevId(id)
    try {
      await adminService.reviewQuestion(id, { status, reviewNote: noteText[id]?.trim() || undefined })
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      onCountChange(questions.filter((q) => q.id !== id && q.status === 'PENDING').length)
    } catch { /* silencioso */ }
    finally { setRevId(null) }
  }

  const pending  = questions.filter((q) => q.status === 'PENDING')
  const rejected = questions.filter((q) => q.status === 'REJECTED')

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <div className="rounded-xl border border-game-border bg-game-surface p-12 text-center">
          <p className="text-lg text-emerald-400">✓ Sin preguntas pendientes</p>
          <p className="mt-1 text-sm text-slate-500">Todas las contribuciones han sido revisadas.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-200">
                Pendientes de revisión
                <span className="ml-2 rounded-full bg-amber-900/50 px-2 py-0.5 text-sm text-amber-300">
                  {pending.length}
                </span>
              </h2>
              {pending.map((q) => (
                <ReviewCard key={q.id} question={q}
                  note={noteText[q.id] ?? ''}
                  onNoteChange={(v) => setNoteText((p) => ({ ...p, [q.id]: v }))}
                  onApprove={() => review(q.id, 'APPROVED')}
                  onReject={() => review(q.id, 'REJECTED')}
                  busy={reviewingId === q.id}
                />
              ))}
            </section>
          )}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold text-slate-400">
                Rechazadas previamente
                <span className="ml-2 text-sm text-red-500">{rejected.length}</span>
              </h2>
              {rejected.map((q) => (
                <ReviewCard key={q.id} question={q}
                  note={noteText[q.id] ?? ''}
                  onNoteChange={(v) => setNoteText((p) => ({ ...p, [q.id]: v }))}
                  onApprove={() => review(q.id, 'APPROVED')}
                  onReject={() => review(q.id, 'REJECTED')}
                  busy={reviewingId === q.id}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function ReviewCard({ question: q, note, onNoteChange, onApprove, onReject, busy }: {
  question: PendingQuestion; note: string; onNoteChange: (v: string) => void
  onApprove: () => void; onReject: () => void; busy: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const author = q.author?.profile?.displayName ?? q.author?.username ?? 'Desconocido'
  const correctMC = q.type !== 'NUMERIC_INPUT' ? (q.correctAnswer as { id: string }).id : null
  const correctNum = q.type === 'NUMERIC_INPUT' ? (q.correctAnswer as { value: number; tolerance: number }) : null

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-violet-900/40 px-1.5 py-0.5 text-violet-300">{author}</span>
            <span>{TOPIC_LABELS[q.topic] ?? q.topic}</span>
            <span>{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</span>
            <span className="rounded bg-slate-700/60 px-1.5 py-0.5">{TYPE_LABELS[q.type] ?? q.type}</span>
            <span>{new Date(q.createdAt).toLocaleDateString('es')}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-200">{chemFormat(q.stem)}</p>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 text-xs text-slate-500 hover:text-slate-300">
          {expanded ? 'Contraer ▲' : 'Expandir ▼'}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-game-border/50 px-4 pb-4 pt-3 space-y-3">
          {q.options && q.options.length > 0 && (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {q.options.map((opt) => (
                <div key={opt.id} className={`rounded px-3 py-1.5 text-sm ${
                  correctMC === opt.id
                    ? 'border border-emerald-700/60 bg-emerald-900/20 text-emerald-300'
                    : 'border border-slate-700/40 bg-slate-800/40 text-slate-300'
                }`}>
                  <span className="mr-1.5 font-semibold">{opt.id.toUpperCase()}.</span>
                  {chemFormat(opt.text)}
                  {correctMC === opt.id && <span className="ml-1.5 text-xs">✓</span>}
                </div>
              ))}
            </div>
          )}
          {correctNum && (
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Respuesta:</span>{' '}
              <span className="font-semibold text-emerald-400">{correctNum.value}</span>
              {correctNum.tolerance > 0 && <span className="ml-1 text-slate-500">± {correctNum.tolerance}</span>}
            </p>
          )}
          {q.explanation && (
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Explicación:</span> {chemFormat(q.explanation)}
            </p>
          )}
          {q.reviewNote && (
            <p className="rounded border border-amber-800/40 bg-amber-900/20 px-2 py-1.5 text-xs text-amber-300">
              <span className="font-semibold">Nota anterior:</span> {q.reviewNote}
            </p>
          )}
          <div className="space-y-1">
            <label className="block text-xs text-slate-500">Nota para el docente (opcional)</label>
            <input type="text" value={note} onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Ej: Falta indicar las masas atómicas."
              className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onApprove} disabled={busy}
              className="flex-1 rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              {busy ? '…' : '✓ Aprobar'}
            </button>
            <button onClick={onReject} disabled={busy}
              className="flex-1 rounded-lg border border-red-700/60 bg-red-900/20 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/40 disabled:opacity-50">
              {busy ? '…' : '✗ Rechazar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bank tab ──────────────────────────────────────────────────────────────────

function BankTab() {
  const [bankView, setBankView] = useState<'list' | 'create'>('list')
  const [editingQuestion, setEditingQuestion] = useState<ApprovedQuestion | null>(null)
  const [questions, setQuestions] = useState<ApprovedQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [topicFilter, setTopicFilter] = useState('ALL')
  const [toggling, setToggling]   = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    adminService.getApprovedQuestions().then(setQuestions).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      const updated = await adminService.toggleQuestion(id)
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, isActive: updated.isActive } : q))
    } catch { /* silencioso */ }
    finally { setToggling(null) }
  }

  const handleCreateQuestion = async (draft: QuestionDraft) => {
    setSubmitting(true)
    try {
      const created = await adminService.createQuestion(draft)
      setQuestions((prev) => [created, ...prev])
      setBankView('list')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateQuestion = async (draft: QuestionDraft) => {
    if (!editingQuestion) return
    setSubmitting(true)
    try {
      const updated = await adminService.updateQuestion(editingQuestion.id, draft)
      setQuestions((prev) => prev.map((q) => q.id === updated.id ? updated : q))
      setEditingQuestion(null)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (q: ApprovedQuestion) => {
    setEditingQuestion(q)
    setBankView('list')
  }

  const topics = ['ALL', ...Array.from(new Set(questions.map((q) => q.topic)))]
  const filtered = questions.filter((q) => {
    const matchTopic = topicFilter === 'ALL' || q.topic === topicFilter
    const matchSearch = q.stem.toLowerCase().includes(search.toLowerCase())
    return matchTopic && matchSearch
  })

  if (loading) return <LoadingSkeleton rows={5} />

  // ── Edit view ────────────────────────────────────────────────────────────────
  if (editingQuestion) {
    const iv: QuestionEditorInitialValues = {
      type: editingQuestion.type as QuestionEditorInitialValues['type'],
      topic: editingQuestion.topic,
      difficulty: editingQuestion.difficulty,
      stem: editingQuestion.stem,
      explanation: editingQuestion.explanation,
      options: editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingQuestion(null)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ← Volver al banco
          </button>
          <span className="text-sm text-slate-500">Editando pregunta</span>
        </div>
        <div className="card">
          <QuestionEditor
            key={editingQuestion.id}
            initialValues={iv}
            onSubmit={handleUpdateQuestion}
            submitting={submitting}
            submitLabel="Guardar cambios"
            successMessage="Pregunta actualizada correctamente."
            hideNote
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setBankView('list')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            bankView === 'list' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Banco de preguntas
        </button>
        <button
          onClick={() => setBankView('create')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            bankView === 'create' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          + Nueva pregunta
        </button>
      </div>

      {bankView === 'create' ? (
        <div className="card">
          <QuestionEditor
            onSubmit={handleCreateQuestion}
            submitting={submitting}
            submitLabel="Crear pregunta"
            successMessage="Pregunta creada y aprobada automáticamente."
            hideNote
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
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
            <input type="search" placeholder="Buscar enunciado…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-56 rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-500">{filtered.length} preguntas</span>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Enunciado</th>
                    <th className="px-4 py-2">Tema</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Autor</th>
                    <th className="px-4 py-2 text-center">Dif.</th>
                    <th className="px-4 py-2 text-center">Estado</th>
                    <th className="px-4 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                      <td className="px-4 py-2 max-w-xs">
                        <p className="truncate text-slate-200">{chemFormat(q.stem)}</p>
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{TOPIC_LABELS[q.topic] ?? q.topic}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{TYPE_LABELS[q.type] ?? q.type}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">
                        {q.author?.profile?.displayName ?? q.author?.username ?? 'Sistema'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-slate-400">
                        {'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggle(q.id)}
                          disabled={toggling === q.id}
                          className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
                            q.isActive
                              ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                              : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                          }`}
                        >
                          {toggling === q.id ? '…' : q.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => openEdit(q)}
                          className="text-xs font-medium text-brand-400 hover:text-brand-300"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        No hay preguntas aprobadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, suffix = '' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="card space-y-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}{suffix}</p>
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

function ErrorMsg() {
  return <p className="text-center text-sm text-slate-500">No se pudieron cargar los datos.</p>
}

// ── System tab ────────────────────────────────────────────────────────────────

type SeedAction = 'reset' | 'demo'

function SystemTab() {
  const [confirmed, setConfirmed] = useState<SeedAction | null>(null)
  const [running, setRunning]     = useState<SeedAction | null>(null)
  const [result, setResult]       = useState<{ action: SeedAction; ok: boolean; message: string; details: string[] } | null>(null)

  const run = async (action: SeedAction) => {
    setRunning(action)
    setResult(null)
    try {
      const res = action === 'reset'
        ? await adminService.seedReset()
        : await adminService.seedDemo()
      setResult({ action, ok: true, message: res.message, details: res.details })
    } catch {
      setResult({ action, ok: false, message: 'Ocurrió un error. Revisa la consola del backend.', details: [] })
    } finally {
      setRunning(null)
      setConfirmed(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl border p-4 ${
          result.ok
            ? 'border-emerald-700/50 bg-emerald-900/20'
            : 'border-red-700/50 bg-red-900/20'
        }`}>
          <p className={`font-semibold ${result.ok ? 'text-emerald-300' : 'text-red-400'}`}>
            {result.ok ? '✓' : '✕'} {result.message}
          </p>
          {result.details.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {result.details.map((d, i) => (
                <li key={i} className="text-xs text-slate-400">· {d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Reset card */}
      <div className="card space-y-4 border-red-900/40">
        <div>
          <h2 className="font-display text-lg font-semibold text-red-400">Reiniciar sistema</h2>
          <p className="mt-1 text-sm text-slate-400">
            Elimina todos los usuarios (excepto el administrador), grupos, progreso y preguntas de docentes.
            Las preguntas base por nivel y los logros se conservan.
          </p>
          <div className="mt-2 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2 text-xs text-red-400">
            ⚠ Esta acción es irreversible. Los datos de estudiantes y docentes se perderán definitivamente.
          </div>
        </div>

        {confirmed === 'reset' ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-400">¿Confirmas el reinicio completo?</span>
            <button
              onClick={() => run('reset')}
              disabled={running !== null}
              className="rounded-lg bg-red-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {running === 'reset' ? 'Reiniciando…' : 'Sí, reiniciar'}
            </button>
            <button
              onClick={() => setConfirmed(null)}
              className="rounded-lg border border-game-border px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmed('reset')}
            disabled={running !== null}
            className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/40 disabled:opacity-50"
          >
            Reiniciar sistema
          </button>
        )}
      </div>

      {/* Demo card */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-300">Cargar datos demo</h2>
          <p className="mt-1 text-sm text-slate-400">
            Reinicia el sistema y crea un escenario completo de prueba:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            <li>· <span className="text-slate-300">3 docentes</span> — Prof. Ana Martínez (2 grupos), Prof. Luis Rodríguez, Prof. Carmen Vega</li>
            <li>· <span className="text-slate-300">4 grupos</span> — Química A y B, Física-Química, Ciencias Integradas</li>
            <li>· <span className="text-slate-300">40 estudiantes</span> — 10 por grupo, progreso aleatorio entre 0 y 6 niveles</li>
            <li>· <span className="text-slate-300">6 preguntas de docentes</span> — 3 aprobadas, 2 pendientes, 1 rechazada</li>
            <li>· Contraseña de todos los usuarios demo: <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-amber-300">Demo1234</code></li>
          </ul>
        </div>

        {confirmed === 'demo' ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-400">¿Cargar datos demo? (borrará los datos actuales)</span>
            <button
              onClick={() => run('demo')}
              disabled={running !== null}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {running === 'demo' ? 'Cargando…' : 'Sí, cargar demo'}
            </button>
            <button
              onClick={() => setConfirmed(null)}
              className="rounded-lg border border-game-border px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmed('demo')}
            disabled={running !== null}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            Cargar datos demo
          </button>
        )}
      </div>
    </div>
  )
}

