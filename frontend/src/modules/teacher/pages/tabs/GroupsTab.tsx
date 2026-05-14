import { useEffect, useState } from 'react'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import { teacherService } from '../../services/teacher.service'
import type { TeacherGroup, GroupStudent, UnassignedStudent, ProgressWithLevel } from '../../services/teacher.service'
import { LoadingSkeleton } from './shared'

export function GroupsTab() {
  const [groups, setGroups]          = useState<TeacherGroup[]>([])
  const [loading, setLoading]        = useState(true)
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
        <GroupDetail
          group={selectedGroup}
          onStudentAdded={(count) =>
            setGroups((prev) => prev.map((g) =>
              g.id === selectedGroup.id ? { ...g, _count: { students: count } } : g,
            ))
          }
        />
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
            {downloading ? '…' : 'Descargar CSV'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Nuevo estudiante — {group.name}
          </p>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
