import { useState } from 'react'
import { ChemInput } from './ChemInput'
import type { QuestionDraft, QuestionType } from '../services/teacher.service'

// ── Topic / level catalogue ──────────────────────────────────────────────────

interface TopicDef {
  value: string
  label: string
  level: number
  allowedTypes: QuestionType[]
  hints: string[]
}

const TOPICS: TopicDef[] = [
  {
    value: 'molar_mass',
    label: 'Masa Molar',
    level: 1,
    allowedTypes: ['MULTIPLE_CHOICE', 'NUMERIC_INPUT'],
    hints: [
      'Usa compuestos con al menos 2 elementos (NaCl, H₂O, CO₂…)',
      'Para NUMERIC: proporciona masa atómica entre paréntesis en el enunciado',
      'Ej. stem: "Calcula la masa molar del NaCl (Na=22.99, Cl=35.45)"',
    ],
  },
  {
    value: 'balancing',
    label: 'Balanceo de Ecuaciones',
    level: 2,
    allowedTypes: ['MULTIPLE_CHOICE', 'NUMERIC_INPUT', 'EQUATION_BALANCE'],
    hints: [
      'EQUATION_BALANCE: el enunciado plantea la ecuación sin balancear',
      'NUMERIC: pide el coeficiente de un compuesto específico',
      'Ej. stem: "¿Cuántos moles de O2 se necesitan en CH4 + O2 -> CO2 + H2O?"',
    ],
  },
  {
    value: 'stoichiometry',
    label: 'Estequiometría Básica',
    level: 3,
    allowedTypes: ['MULTIPLE_CHOICE', 'NUMERIC_INPUT'],
    hints: [
      'La reacción ya debe ir balanceada en el enunciado',
      'Para NUMERIC: pide gramos o moles de un producto/reactivo',
      'Ej. stem: "En 2H2 + O2 -> 2H2O, ¿cuántos mol de H2O se obtienen de 4 mol de H2?"',
    ],
  },
  {
    value: 'limiting_reagent',
    label: 'Reactivo Límite',
    level: 4,
    allowedTypes: ['MULTIPLE_CHOICE', 'NUMERIC_INPUT'],
    hints: [
      'Incluye las cantidades disponibles de cada reactivo en el enunciado',
      'MULTIPLE_CHOICE: ¿cuál es el reactivo límite? / ¿cuánto producto se forma?',
      'Ej. stem: "Se tienen 3 mol de N2 y 6 mol de H2. N2 + 3H2 -> 2NH3. ¿Cuál es el reactivo límite?"',
    ],
  },
  {
    value: 'yield',
    label: 'Rendimiento Porcentual',
    level: 5,
    allowedTypes: ['MULTIPLE_CHOICE', 'NUMERIC_INPUT'],
    hints: [
      'Fórmula: %R = (rendimiento real / rendimiento teórico) × 100',
      'NUMERIC: da rendimiento real y teórico, pide el porcentaje',
      'Ej. stem: "El rendimiento teórico es 50 g y el real es 45 g. ¿Cuál es el %R?"',
    ],
  },
]

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Selección múltiple (4 opciones)',
  NUMERIC_INPUT:   'Respuesta numérica',
  EQUATION_BALANCE: 'Ecuación balanceada (4 opciones)',
}

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const
type OptionId = typeof OPTION_IDS[number]

// ── Component ────────────────────────────────────────────────────────────────

export interface QuestionEditorInitialValues {
  type: QuestionType
  topic: string
  difficulty: number
  stem: string
  explanation: string | null
  options: { id: string; text: string }[] | null
  correctAnswer: unknown
}

interface QuestionEditorProps {
  onSubmit: (draft: QuestionDraft) => Promise<void>
  submitting?: boolean
  submitLabel?: string
  successMessage?: string
  hideNote?: boolean
  initialValues?: QuestionEditorInitialValues
}

function initOptions(iv?: QuestionEditorInitialValues): Record<OptionId, string> {
  const base: Record<OptionId, string> = { a: '', b: '', c: '', d: '' }
  if (!iv?.options) return base
  for (const opt of iv.options) {
    if (opt.id === 'a' || opt.id === 'b' || opt.id === 'c' || opt.id === 'd') {
      base[opt.id] = opt.text
    }
  }
  return base
}

function initCorrectId(iv?: QuestionEditorInitialValues): OptionId {
  if (iv?.correctAnswer && typeof iv.correctAnswer === 'object' && 'id' in (iv.correctAnswer as object)) {
    const id = (iv.correctAnswer as { id: string }).id
    if (id === 'a' || id === 'b' || id === 'c' || id === 'd') return id
  }
  return 'a'
}

export function QuestionEditor({ onSubmit, submitting, submitLabel, successMessage, hideNote, initialValues }: QuestionEditorProps) {
  const iv = initialValues
  const [topicValue, setTopicValue]   = useState(iv?.topic ?? 'molar_mass')
  const [type, setType]               = useState<QuestionType>(iv?.type ?? 'MULTIPLE_CHOICE')
  const [difficulty, setDifficulty]   = useState(iv?.difficulty ?? 1)
  const [stem, setStem]               = useState(iv?.stem ?? '')
  const [explanation, setExplanation] = useState(iv?.explanation ?? '')

  // MC / EQUATION_BALANCE fields
  const [options, setOptions] = useState<Record<OptionId, string>>(() => initOptions(iv))
  const [correctId, setCorrectId] = useState<OptionId>(() => initCorrectId(iv))

  // NUMERIC_INPUT fields
  const [numValue, setNumValue] = useState(() => {
    if (iv?.correctAnswer && typeof iv.correctAnswer === 'object' && 'value' in (iv.correctAnswer as object)) {
      return String((iv.correctAnswer as { value: number }).value)
    }
    return ''
  })
  const [numTolerance, setNumTolerance] = useState(() => {
    if (iv?.correctAnswer && typeof iv.correctAnswer === 'object' && 'tolerance' in (iv.correctAnswer as object)) {
      return String((iv.correctAnswer as { tolerance: number }).tolerance)
    }
    return '0'
  })

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const topic = TOPICS.find((t) => t.value === topicValue)!

  const handleTopicChange = (v: string) => {
    setTopicValue(v)
    const def = TOPICS.find((t) => t.value === v)!
    if (!def.allowedTypes.includes(type)) setType(def.allowedTypes[0])
  }

  const validate = (): string | null => {
    if (!stem.trim()) return 'El enunciado es obligatorio.'
    if (!explanation.trim()) return 'La explicación es obligatoria.'
    if (type === 'MULTIPLE_CHOICE' || type === 'EQUATION_BALANCE') {
      if (OPTION_IDS.some((id) => !options[id].trim()))
        return 'Todas las opciones deben tener texto.'
    }
    if (type === 'NUMERIC_INPUT') {
      if (isNaN(parseFloat(numValue))) return 'El valor numérico correcto debe ser un número.'
      if (isNaN(parseFloat(numTolerance)) || parseFloat(numTolerance) < 0)
        return 'La tolerancia debe ser un número ≥ 0.'
    }
    return null
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess(false)
    const err = validate()
    if (err) { setError(err); return }

    const draft: QuestionDraft = {
      type,
      topic: topicValue,
      difficulty,
      stem: stem.trim(),
      explanation: explanation.trim(),
      ...(type === 'MULTIPLE_CHOICE' || type === 'EQUATION_BALANCE'
        ? {
            options: OPTION_IDS.map((id) => ({ id, text: options[id].trim() })),
            correctAnswer: { id: correctId },
          }
        : {
            correctAnswer: {
              value: parseFloat(numValue),
              tolerance: parseFloat(numTolerance),
            },
          }),
    }

    await onSubmit(draft)

    if (!iv) {
      // Create mode: reset form after successful submit
      setStem('')
      setExplanation('')
      setOptions({ a: '', b: '', c: '', d: '' })
      setCorrectId('a')
      setNumValue('')
      setNumTolerance('0')
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  const isMC = type === 'MULTIPLE_CHOICE' || type === 'EQUATION_BALANCE'

  return (
    <div className="space-y-6">

      {/* ── Config row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Topic */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tema / Nivel
          </label>
          <select
            value={topicValue}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                Nivel {t.level} — {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tipo de pregunta
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {topic.allowedTypes.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dificultad
          </label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  difficulty === d
                    ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                    : 'border-game-border bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {'★'.repeat(d)}{'☆'.repeat(3 - d)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hints for this topic ────────────────────────────────────────────── */}
      <div className="rounded-lg border border-sky-900/50 bg-sky-950/30 px-4 py-3">
        <p className="mb-1.5 text-xs font-semibold text-sky-400">
          Guía — {topic.label} (Nivel {topic.level})
        </p>
        <ul className="space-y-0.5">
          {topic.hints.map((h, i) => (
            <li key={i} className="text-xs leading-relaxed text-slate-400">
              <span className="mr-1.5 text-sky-600">›</span>
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Stem ────────────────────────────────────────────────────────────── */}
      <ChemInput
        label="Enunciado"
        required
        value={stem}
        onChange={setStem}
        placeholder="Escribe el enunciado de la pregunta. Usa H2O, CO2, -> , <-> ..."
        rows={3}
      />

      {/* ── Options (MC / EQUATION_BALANCE) ─────────────────────────────────── */}
      {isMC && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Opciones —{' '}
            <span className="text-emerald-400">selecciona el círculo de la respuesta correcta</span>
          </p>
          {OPTION_IDS.map((id) => (
            <div key={id} className="flex items-start gap-3">
              {/* Correct-answer radio */}
              <button
                type="button"
                title={`Marcar opción ${id.toUpperCase()} como correcta`}
                onClick={() => setCorrectId(id)}
                className={`mt-6 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  correctId === id
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-slate-600 text-transparent hover:border-slate-400'
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <ChemInput
                  label={`Opción ${id.toUpperCase()}`}
                  required
                  value={options[id]}
                  onChange={(v) => setOptions((prev) => ({ ...prev, [id]: v }))}
                  placeholder={`Ej: ${id === 'a' ? '18 g/mol' : id === 'b' ? '16 g/mol' : id === 'c' ? '20 g/mol' : '10 g/mol'}`}
                  rows={1}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Numeric answer ───────────────────────────────────────────────────── */}
      {type === 'NUMERIC_INPUT' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Respuesta correcta <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={numValue}
              onChange={(e) => setNumValue(e.target.value)}
              placeholder="Ej: 58.44"
              className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tolerancia ±
            </label>
            <input
              type="number"
              value={numTolerance}
              onChange={(e) => setNumTolerance(e.target.value)}
              placeholder="Ej: 0.5"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-game-border bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-500">
              El estudiante puede responder ± este valor y se considerará correcto.
            </p>
          </div>
        </div>
      )}

      {/* ── Explanation ──────────────────────────────────────────────────────── */}
      <ChemInput
        label="Explicación (se muestra al estudiante cuando responde mal)"
        required
        value={explanation}
        onChange={setExplanation}
        placeholder="Ej: H = 1 × 2 = 2 g/mol; O = 16 g/mol. Total = 18 g/mol"
        rows={2}
      />

      {/* ── Feedback messages ────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
          ⚠ {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-800/50 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">
          ✓ {successMessage ?? 'Pregunta enviada. Quedará pendiente hasta que un administrador la apruebe.'}
        </p>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Enviando…' : (submitLabel ?? 'Enviar para revisión')}
      </button>

      {!hideNote && (
        <p className="text-center text-xs text-slate-500">
          La pregunta quedará en estado <span className="text-amber-400">Pendiente</span> hasta
          que el administrador la apruebe. Solo preguntas aprobadas entran al pool del juego.
        </p>
      )}
    </div>
  )
}
