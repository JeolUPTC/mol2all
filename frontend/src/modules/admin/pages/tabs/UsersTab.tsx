import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminUser } from '../../services/admin.service'
import { ROLE_LABELS, ROLE_COLORS, LoadingSkeleton } from './shared'

export function UsersTab() {
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
            {createError && <p className="text-xs text-red-400">{createError}</p>}
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

      {/* Filters + table */}
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
                  <td className="px-4 py-2 text-xs text-slate-400">{u.email}</td>
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
