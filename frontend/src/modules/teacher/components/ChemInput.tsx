import { useRef } from 'react'
import { chemFormat } from '../../game/utils/chemFormat'

interface ChemInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  label?: string
  required?: boolean
}

function insertAt(original: string, start: number, end: number, text: string) {
  return original.slice(0, start) + text + original.slice(end)
}

const TOOLBAR_BUTTONS = [
  { label: '→',  insert: '->',  title: 'Flecha de reacción  (escribe -> y se convierte en →)' },
  { label: '⇌',  insert: '<->', title: 'Equilibrio reversible (escribe <->)' },
  { label: '·',  insert: '·',   title: 'Punto de hidratación  (ej. CuSO₄·5H₂O)' },
  { label: ' + ', insert: ' + ', title: 'Operador más con espacios' },
  { label: '( )', insert: '()',  title: 'Paréntesis  (ej. Ca(OH)2 → Ca(OH)₂)' },
] as const

const TEMPLATES = [
  { label: 'A + B → C',      insert: 'A + B -> C',              title: 'Reacción simple' },
  { label: 'A + B ⇌ C + D',  insert: 'A + B <-> C + D',        title: 'Equilibrio' },
  { label: 'Coef. + fórmula', insert: '2H2 + O2 -> 2H2O',       title: 'Ejemplo con coeficientes' },
] as const

export function ChemInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
  required,
}: ChemInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const insertText = (text: string) => {
    const el = ref.current
    if (!el) {
      onChange(value + text)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    onChange(insertAt(value, start, end, text))
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      el.selectionStart = start + text.length
      el.selectionEnd = start + text.length
      el.focus()
    })
  }

  const preview = value.trim() ? chemFormat(value) : ''

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1">
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.insert}
            type="button"
            title={btn.title}
            onClick={() => insertText(btn.insert)}
            className="rounded border border-game-border bg-slate-700 px-2 py-0.5 font-mono text-sm text-slate-200 transition-colors hover:bg-slate-600 hover:text-white"
          >
            {btn.label}
          </button>
        ))}

        <span className="mx-1 text-slate-600">|</span>

        {TEMPLATES.map((t) => (
          <button
            key={t.insert}
            type="button"
            title={t.title}
            onClick={() => insertText(t.insert)}
            className="rounded border border-dashed border-slate-600 px-2 py-0.5 text-xs text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-200"
          >
            {t.label}
          </button>
        ))}

        {/* Hint chip */}
        <span
          title="Escribe H2O y verás H₂O en la vista previa. Los dígitos después de símbolos de elementos se convierten en subíndices automáticamente."
          className="ml-auto cursor-help rounded-full border border-dashed border-sky-800/60 px-2 py-0.5 text-xs text-sky-600"
        >
          H₂O auto
        </span>
      </div>

      {/* ── Textarea ────────────────────────────────────────────────────────── */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full resize-y rounded-lg border border-game-border bg-slate-800 px-3 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {/* ── Live preview ────────────────────────────────────────────────────── */}
      {preview && (
        <div className="flex items-start gap-2 rounded-md border border-slate-700/50 bg-slate-900/60 px-3 py-2">
          <span className="mt-0.5 flex-shrink-0 text-xs text-slate-500">Vista:</span>
          <span className="text-sm leading-relaxed text-slate-200">{preview}</span>
        </div>
      )}
    </div>
  )
}
