import { useState } from 'react'
import { adminService } from '../../services/admin.service'

type SeedAction = 'reset' | 'demo' | 'e2e'

const E2E_USERS = [
  { role: 'Estudiante', email: 'estudiante@mol2all.com', password: 'student1234' },
  { role: 'Docente',    email: 'docente@mol2all.com',    password: 'teacher1234' },
  { role: 'Admin',      email: 'admin@mol2all.com',      password: 'admin1234'   },
]

export function SystemTab() {
  const [confirmed, setConfirmed] = useState<SeedAction | null>(null)
  const [running, setRunning]     = useState<SeedAction | null>(null)
  const [result, setResult]       = useState<{
    action: SeedAction; ok: boolean; message: string; details: string[]
  } | null>(null)

  const run = async (action: SeedAction) => {
    setRunning(action)
    setResult(null)
    try {
      const res = action === 'reset'
        ? await adminService.seedReset()
        : action === 'demo'
          ? await adminService.seedDemo()
          : await adminService.seedE2e()
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
      {result && (
        <div className={`rounded-xl border p-4 ${
          result.ok ? 'border-emerald-700/50 bg-emerald-900/20' : 'border-red-700/50 bg-red-900/20'
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

      <div className="card space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-300">Cargar datos demo</h2>
          <p className="mt-1 text-sm text-slate-400">Reinicia el sistema y crea un escenario completo de prueba:</p>
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

      <div className="card space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-sky-300">Usuarios de prueba E2E</h2>
          <p className="mt-1 text-sm text-slate-400">
            Crea (o actualiza) los tres usuarios fijos que usan los tests de Playwright.
            Esta operación es segura: no borra datos existentes.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-game-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-game-border bg-slate-800/50">
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Rol</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-400">Contraseña</th>
                </tr>
              </thead>
              <tbody>
                {E2E_USERS.map((u) => (
                  <tr key={u.email} className="border-b border-game-border/50 last:border-0">
                    <td className="px-3 py-2 text-slate-300">{u.role}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{u.email}</td>
                    <td className="px-3 py-2 font-mono text-amber-300">{u.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => run('e2e')}
          disabled={running !== null}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
        >
          {running === 'e2e' ? 'Creando…' : 'Crear usuarios de prueba'}
        </button>
      </div>
    </div>
  )
}
