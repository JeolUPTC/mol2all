import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { UserAchievement } from '@core/types/game.types'
import type { ApiResponse } from '@core/types/api.types'
import type { User } from '@core/types/user.types'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const isStudent = user?.role === 'STUDENT'

  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true)

  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    if (!isStudent) {
      setIsLoadingAchievements(false)
      return
    }
    apiClient
      .get<ApiResponse<UserAchievement[]>>(ENDPOINTS.users.achievements)
      .then(({ data }) => setAchievements(data.data))
      .catch(() => {})
      .finally(() => setIsLoadingAchievements(false))
  }, [isStudent])

  const startEdit = () => {
    setDisplayName(user?.profile?.displayName ?? user?.username ?? '')
    setSaveError('')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancelEdit = () => {
    setEditing(false)
    setSaveError('')
  }

  const saveEdit = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      setSaveError('El nombre no puede estar vacío')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const { data } = await apiClient.patch<ApiResponse<User>>(ENDPOINTS.users.updateMe, {
        displayName: trimmed,
      })
      setUser(data.data)
      setEditing(false)
    } catch {
      setSaveError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('Completa todos los campos.')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('La contraseña nueva debe tener al menos 6 caracteres.')
      return
    }
    setPwSaving(true)
    try {
      await apiClient.post(ENDPOINTS.users.changePassword, {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      })
      setPwForm({ current: '', newPw: '', confirm: '' })
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPwError(msg ?? 'No se pudo cambiar la contraseña.')
    } finally {
      setPwSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Mi Perfil</h1>

      {/* Identity card */}
      <div className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-3xl font-bold text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  maxLength={64}
                  className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-1.5 font-display text-xl font-bold text-slate-100 focus:border-brand-500 focus:outline-none"
                />
                {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="rounded-lg bg-brand-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg px-3 py-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-slate-100">
                    {user?.profile?.displayName ?? user?.username}
                  </h2>
                  <button
                    onClick={startEdit}
                    title="Editar nombre"
                    className="rounded p-1 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    ✎
                  </button>
                </div>
                <p className="text-sm text-slate-400">{user?.email}</p>
                <span className="mt-1 inline-block rounded bg-brand-900 px-2 py-0.5 text-xs font-medium text-brand-300">
                  {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
                </span>
              </div>
            )}
          </div>
        </div>

        {isStudent && (
          <div className="grid grid-cols-2 gap-4 border-t border-game-border pt-4">
            <div className="card bg-slate-800">
              <p className="text-sm text-slate-400">XP Total</p>
              <p className="font-display text-2xl font-bold text-game-xp">
                {user?.profile?.totalXp ?? 0}
              </p>
            </div>
            <div className="card bg-slate-800">
              <p className="text-sm text-slate-400">Monedas</p>
              <p className="font-display text-2xl font-bold text-game-coins">
                {user?.profile?.totalCoins ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="font-display text-lg font-semibold text-slate-200">Cambiar contraseña</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Contraseña actual</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Nueva contraseña</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-slate-400">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          {pwSuccess && (
            <p className="text-xs text-emerald-400">✓ Contraseña actualizada correctamente.</p>
          )}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {pwSaving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>

      {/* Achievements — students only */}
      {isStudent && (
        <div>
          <h2 className="mb-3 font-display text-xl font-semibold text-slate-200">Logros</h2>

          {isLoadingAchievements ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 animate-pulse bg-game-surface" />
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="card py-8 text-center">
              <p className="text-3xl">🔬</p>
              <p className="mt-2 text-sm text-slate-400">
                Completa tu primer nivel para desbloquear logros
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {achievements.map((ua) => (
                <AchievementBadge key={ua.achievementId} userAchievement={ua} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AchievementBadge({ userAchievement }: { userAchievement: UserAchievement }) {
  const { achievement, unlockedAt } = userAchievement
  const date = new Date(unlockedAt).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="card flex items-start gap-3 border-amber-500/30 bg-amber-900/10">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-2xl">
        🏆
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-amber-300">{achievement.name}</p>
        <p className="truncate text-xs text-slate-400">{achievement.description}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-medium text-game-xp">+{achievement.xpReward} XP</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{date}</span>
        </div>
      </div>
    </div>
  )
}
