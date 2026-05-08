import { useEffect } from 'react'
import { useUIStore } from '@stores/uiStore'

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
}

const COLORS: Record<string, string> = {
  success: 'border-emerald-500 bg-emerald-900/80 text-emerald-100',
  error: 'border-red-500 bg-red-900/80 text-red-100',
  info: 'border-sky-500 bg-sky-900/80 text-sky-100',
  warning: 'border-amber-500 bg-amber-900/80 text-amber-100',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: { id: string; type: string; message: string }
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${COLORS[toast.type] ?? COLORS.info} min-w-[280px] max-w-sm`}
    >
      <span className="mt-0.5 text-lg font-bold">{ICONS[toast.type] ?? ICONS.info}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="ml-1 mt-0.5 text-sm opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
