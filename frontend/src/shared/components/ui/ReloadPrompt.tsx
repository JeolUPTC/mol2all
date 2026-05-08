import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-game-border bg-slate-800 px-4 py-3 shadow-2xl">
      <p className="text-sm text-slate-300">
        Nueva versión disponible.
      </p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
      >
        Actualizar
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-slate-500 transition-colors hover:text-slate-300"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  )
}
