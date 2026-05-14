import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminGroup, AdminTeacher, GroupStudent, AdminUnassignedStudent } from '../../services/admin.service'
import { LoadingSkeleton } from './shared'

export function GroupsTab() {
  const [groups, setGroups]     = useState<AdminGroup[]>([])
  const [teachers, setTeachers] = useState<AdminTeacher[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', teacherId: '' })
  const [creating, setCreating] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null)

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

      {/* Groups table */}
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
                    {g.description && <p className="text-xs text-slate-500">{g.description}</p>}
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
                  <td className="px-4 py-2 text-right tabular-nums text-sky-400">{g._count.students}</td>
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
                      <td className="px-4 py-2 text-right tabular-nums text-game-xp">{s.profile?.totalXp ?? 0}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-400">{s._count.progress}</td>
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
