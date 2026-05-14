import { useState } from 'react'
import { gameEventBus } from '../bridge/gameEventBus'
import { chemFormat } from '../utils/chemFormat'
import type { GameQuestion } from '../services/questions.service'

interface Props {
  question: GameQuestion
  startTime: number
  onAnswer: (isCorrect: boolean, timeSpent: number) => void
}

const STEM_STYLE: React.CSSProperties = { fontSize: 'clamp(1.1rem, 2.5vw, 1.75rem)', lineHeight: 1.45 }
const OPT_STYLE: React.CSSProperties  = { fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)' }
const FB_STYLE: React.CSSProperties   = { fontSize: 'clamp(1rem, 2vw, 1.4rem)' }

// ── Element data ──────────────────────────────────────────────────────────────

interface Elem { sym: string; name: string; num: number; mass: number; col: number; row: number; type: string }

const ELEMENTS: Elem[] = [
  { sym:'H',  name:'Hidrógeno',  num:1,  mass:1.008,   col:1,  row:1, type:'nonmetal' },
  { sym:'He', name:'Helio',      num:2,  mass:4.003,   col:18, row:1, type:'noble_gas' },
  { sym:'Li', name:'Litio',      num:3,  mass:6.941,   col:1,  row:2, type:'alkali_metal' },
  { sym:'Be', name:'Berilio',    num:4,  mass:9.012,   col:2,  row:2, type:'alkaline_earth' },
  { sym:'B',  name:'Boro',       num:5,  mass:10.811,  col:13, row:2, type:'metalloid' },
  { sym:'C',  name:'Carbono',    num:6,  mass:12.011,  col:14, row:2, type:'nonmetal' },
  { sym:'N',  name:'Nitrógeno',  num:7,  mass:14.007,  col:15, row:2, type:'nonmetal' },
  { sym:'O',  name:'Oxígeno',    num:8,  mass:15.999,  col:16, row:2, type:'nonmetal' },
  { sym:'F',  name:'Flúor',      num:9,  mass:18.998,  col:17, row:2, type:'halogen' },
  { sym:'Ne', name:'Neón',       num:10, mass:20.180,  col:18, row:2, type:'noble_gas' },
  { sym:'Na', name:'Sodio',      num:11, mass:22.990,  col:1,  row:3, type:'alkali_metal' },
  { sym:'Mg', name:'Magnesio',   num:12, mass:24.305,  col:2,  row:3, type:'alkaline_earth' },
  { sym:'Al', name:'Aluminio',   num:13, mass:26.982,  col:13, row:3, type:'post_transition' },
  { sym:'Si', name:'Silicio',    num:14, mass:28.086,  col:14, row:3, type:'metalloid' },
  { sym:'P',  name:'Fósforo',    num:15, mass:30.974,  col:15, row:3, type:'nonmetal' },
  { sym:'S',  name:'Azufre',     num:16, mass:32.065,  col:16, row:3, type:'nonmetal' },
  { sym:'Cl', name:'Cloro',      num:17, mass:35.453,  col:17, row:3, type:'halogen' },
  { sym:'Ar', name:'Argón',      num:18, mass:39.948,  col:18, row:3, type:'noble_gas' },
  { sym:'K',  name:'Potasio',    num:19, mass:39.098,  col:1,  row:4, type:'alkali_metal' },
  { sym:'Ca', name:'Calcio',     num:20, mass:40.078,  col:2,  row:4, type:'alkaline_earth' },
  { sym:'Sc', name:'Escandio',   num:21, mass:44.956,  col:3,  row:4, type:'transition_metal' },
  { sym:'Ti', name:'Titanio',    num:22, mass:47.867,  col:4,  row:4, type:'transition_metal' },
  { sym:'V',  name:'Vanadio',    num:23, mass:50.942,  col:5,  row:4, type:'transition_metal' },
  { sym:'Cr', name:'Cromo',      num:24, mass:51.996,  col:6,  row:4, type:'transition_metal' },
  { sym:'Mn', name:'Manganeso',  num:25, mass:54.938,  col:7,  row:4, type:'transition_metal' },
  { sym:'Fe', name:'Hierro',     num:26, mass:55.845,  col:8,  row:4, type:'transition_metal' },
  { sym:'Co', name:'Cobalto',    num:27, mass:58.933,  col:9,  row:4, type:'transition_metal' },
  { sym:'Ni', name:'Níquel',     num:28, mass:58.693,  col:10, row:4, type:'transition_metal' },
  { sym:'Cu', name:'Cobre',      num:29, mass:63.546,  col:11, row:4, type:'transition_metal' },
  { sym:'Zn', name:'Zinc',       num:30, mass:65.38,   col:12, row:4, type:'transition_metal' },
  { sym:'Ga', name:'Galio',      num:31, mass:69.723,  col:13, row:4, type:'post_transition' },
  { sym:'Ge', name:'Germanio',   num:32, mass:72.630,  col:14, row:4, type:'metalloid' },
  { sym:'As', name:'Arsénico',   num:33, mass:74.922,  col:15, row:4, type:'metalloid' },
  { sym:'Se', name:'Selenio',    num:34, mass:78.971,  col:16, row:4, type:'nonmetal' },
  { sym:'Br', name:'Bromo',      num:35, mass:79.904,  col:17, row:4, type:'halogen' },
  { sym:'Kr', name:'Kriptón',    num:36, mass:83.798,  col:18, row:4, type:'noble_gas' },
  { sym:'Rb', name:'Rubidio',    num:37, mass:85.468,  col:1,  row:5, type:'alkali_metal' },
  { sym:'Sr', name:'Estroncio',  num:38, mass:87.62,   col:2,  row:5, type:'alkaline_earth' },
  { sym:'Y',  name:'Itrio',      num:39, mass:88.906,  col:3,  row:5, type:'transition_metal' },
  { sym:'Zr', name:'Circonio',   num:40, mass:91.224,  col:4,  row:5, type:'transition_metal' },
  { sym:'Nb', name:'Niobio',     num:41, mass:92.906,  col:5,  row:5, type:'transition_metal' },
  { sym:'Mo', name:'Molibdeno',  num:42, mass:95.96,   col:6,  row:5, type:'transition_metal' },
  { sym:'Tc', name:'Tecnecio',   num:43, mass:98,      col:7,  row:5, type:'transition_metal' },
  { sym:'Ru', name:'Rutenio',    num:44, mass:101.07,  col:8,  row:5, type:'transition_metal' },
  { sym:'Rh', name:'Rodio',      num:45, mass:102.906, col:9,  row:5, type:'transition_metal' },
  { sym:'Pd', name:'Paladio',    num:46, mass:106.42,  col:10, row:5, type:'transition_metal' },
  { sym:'Ag', name:'Plata',      num:47, mass:107.868, col:11, row:5, type:'transition_metal' },
  { sym:'Cd', name:'Cadmio',     num:48, mass:112.411, col:12, row:5, type:'transition_metal' },
  { sym:'In', name:'Indio',      num:49, mass:114.818, col:13, row:5, type:'post_transition' },
  { sym:'Sn', name:'Estaño',     num:50, mass:118.710, col:14, row:5, type:'post_transition' },
  { sym:'Sb', name:'Antimonio',  num:51, mass:121.760, col:15, row:5, type:'metalloid' },
  { sym:'Te', name:'Teluro',     num:52, mass:127.60,  col:16, row:5, type:'metalloid' },
  { sym:'I',  name:'Yodo',       num:53, mass:126.904, col:17, row:5, type:'halogen' },
  { sym:'Xe', name:'Xenón',      num:54, mass:131.293, col:18, row:5, type:'noble_gas' },
]

const TYPE_CSS: Record<string, string> = {
  nonmetal:        '#3b82f6',
  noble_gas:       '#ec4899',
  alkali_metal:    '#ef4444',
  alkaline_earth:  '#f97316',
  metalloid:       '#14b8a6',
  post_transition: '#22c55e',
  halogen:         '#8b5cf6',
  transition_metal:'#6b7280',
}

const CALC_ROWS = [
  ['C', '(', ')', '⌫'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['.', '0', '=', '+'],
]

function safeEval(expr: string): number | null {
  try {
    const js = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    if (!/^[\d\s+\-*/.()\s]+$/.test(js)) return null
    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict";return(${js})`)() as number
    if (typeof r !== 'number' || !isFinite(r)) return null
    return Math.round(r * 10000) / 10000
  } catch { return null }
}

// ── Periodic Table Modal ──────────────────────────────────────────────────────

function PeriodicTableModal({ onElementSelect, onClose }: {
  onElementSelect?: (mass: number) => void
  onClose: () => void
}) {
  const [sel, setSel] = useState<Elem | null>(null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center overflow-auto bg-black/85 p-3"
    >
      <div className="rounded-xl border-2 border-sky-600 bg-slate-900 p-3">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-sky-300">⚛ Tabla Periódica</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">✕</button>
        </div>

        {/* Grid — 18 cols × 5 rows, scales with viewport */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(18, clamp(1.75rem, 3.2vw, 3rem))',
          gridTemplateRows: 'repeat(5, clamp(2.5rem, 4.8vw, 4.2rem))',
          gap: '2px',
        }}>
          {ELEMENTS.map((el) => {
            const color = TYPE_CSS[el.type] ?? '#6b7280'
            const isSel = sel?.num === el.num
            return (
              <button
                key={el.num}
                title={`${el.name} — ${el.mass} g/mol`}
                onClick={() => setSel(el)}
                style={{
                  gridColumn: el.col,
                  gridRow: el.row,
                  borderColor: color,
                  backgroundColor: isSel ? `${color}55` : `${color}18`,
                }}
                className={`flex flex-col items-center justify-center rounded border transition-colors hover:opacity-90 ${isSel ? 'ring-1 ring-white/50' : ''}`}
              >
                <span style={{ fontSize: 'clamp(6px, 0.5vw, 9px)', color: '#94a3b8', lineHeight: 1 }}>{el.num}</span>
                <span style={{ fontSize: 'clamp(10px, 0.9vw, 14px)', fontWeight: 'bold', color, lineHeight: 1.1 }}>{el.sym}</span>
                <span style={{ fontSize: 'clamp(5px, 0.4vw, 8px)', color: '#94a3b8', lineHeight: 1 }}>{el.mass}</span>
              </button>
            )
          })}
        </div>

        {/* Info bar */}
        {sel ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-3 py-1.5 text-xs">
            <span className="text-slate-300">
              <span className="font-bold text-sky-300">{sel.sym}</span> — {sel.name}
            </span>
            <span className="font-mono text-amber-300">{sel.mass} g/mol</span>
            {onElementSelect && (
              <button
                onClick={() => { onElementSelect(sel.mass); onClose() }}
                className="rounded bg-emerald-700 px-2 py-0.5 text-emerald-100 hover:bg-emerald-600"
              >
                Usar
              </button>
            )}
          </div>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-600">
            Toca un elemento para ver su masa molar
          </p>
        )}
      </div>
    </div>
  )
}

// ── Calculator Modal ──────────────────────────────────────────────────────────

function CalculatorModal({ onInsert, onClose, showPT }: {
  onInsert?: (v: number) => void
  onClose: () => void
  showPT?: boolean
}) {
  const [expr, setExpr] = useState('')
  const [showPTModal, setShowPTModal] = useState(false)
  const result = safeEval(expr)

  const handleKey = (k: string) => {
    if (k === 'C')  { setExpr(''); return }
    if (k === '⌫') { setExpr(e => e.slice(0, -1)); return }
    if (k === '=')  { const r = safeEval(expr); if (r !== null) setExpr(String(r)); return }
    setExpr(e => e.length < 20 ? e + k : e)
  }

  if (showPTModal) {
    return (
      <PeriodicTableModal
        onElementSelect={(mass) => { setExpr(e => e + String(mass)); setShowPTModal(false) }}
        onClose={() => setShowPTModal(false)}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/75"
    >
      <div className="w-72 rounded-xl border-2 border-sky-600 bg-slate-900 p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-sky-300">🧮 Calculadora</span>
          <div className="flex items-center gap-3">
            {showPT && (
              <button onClick={() => setShowPTModal(true)} className="text-xs text-violet-400 hover:text-violet-200">
                ⚛ Tabla
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">✕</button>
          </div>
        </div>

        {/* Display */}
        <div className="mb-3 rounded-lg bg-slate-950 px-3 py-2 text-right">
          <div className="min-h-4 truncate text-sm text-slate-500">{expr || '…'}</div>
          <div className="font-mono text-2xl font-bold text-sky-300">
            {result !== null ? result : expr ? '?' : '0'}
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {CALC_ROWS.flat().map((k, i) => {
            const isOp = ['÷','×','−','+','(',')',].includes(k)
            const isClear = k === 'C' || k === '⌫'
            const isEq = k === '='
            return (
              <button
                key={i}
                onClick={() => handleKey(k)}
                className={`rounded-lg py-2.5 text-sm font-bold transition-colors ${
                  isEq    ? 'bg-sky-700 text-white hover:bg-sky-600' :
                  isClear ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' :
                  isOp    ? 'bg-slate-700 text-sky-300 hover:bg-slate-600' :
                  'bg-slate-800 text-slate-100 hover:bg-slate-700'
                }`}
              >{k}</button>
            )
          })}
        </div>

        {onInsert && result !== null && (
          <button
            onClick={() => { onInsert(result); onClose() }}
            className="mt-3 w-full rounded-lg bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            ↩ Usar {result}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Tool Buttons ──────────────────────────────────────────────────────────────

function ToolButtons({ showCalc, showPT, onOpenCalc, onOpenPT }: {
  showCalc: boolean
  showPT: boolean
  onOpenCalc?: () => void
  onOpenPT?: () => void
}) {
  if (!showCalc && !showPT) return null
  return (
    <div className="mb-3 flex justify-end gap-2">
      {showPT && (
        <button
          onClick={onOpenPT}
          className="rounded border border-violet-800/60 bg-violet-900/20 px-2.5 py-1 text-xs text-violet-300 hover:bg-violet-900/40"
        >⚛ Tabla</button>
      )}
      {showCalc && (
        <button
          onClick={onOpenCalc}
          className="rounded border border-sky-800/60 bg-sky-900/20 px-2.5 py-1 text-xs text-sky-300 hover:bg-sky-900/40"
        >🧮 Calc</button>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function QuizOverlay({ question, startTime, onAnswer }: Props) {
  const isMC = question.type === 'MULTIPLE_CHOICE' || question.type === 'EQUATION_BALANCE'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4">
      {isMC
        ? <MCQuestion question={question} startTime={startTime} onAnswer={onAnswer} />
        : <NumericQuestion question={question} startTime={startTime} onAnswer={onAnswer} />
      }
    </div>
  )
}

// ── MC Question ───────────────────────────────────────────────────────────────

function MCQuestion({ question, startTime, onAnswer }: Props) {
  const [answered, setAnswered]     = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect]   = useState(false)
  const [tool, setTool]             = useState<'calc' | 'pt' | null>(null)

  const correctId   = (question.correctAnswer as { id: string }).id
  const isBalancing = question.topic === 'balancing'
  const isMolarMass = question.topic === 'molar_mass'
  const options     = question.options as { id: string; text: string }[] ?? []

  const handleSelect = (optId: string) => {
    if (answered) return
    const ok = optId === correctId
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    setAnswered(true)
    setSelectedId(optId)
    setIsCorrect(ok)
    gameEventBus.emit('answer:submitted', { questionId: 'generated', isCorrect: ok, timeSpent })
    if (ok) setTimeout(() => onAnswer(ok, timeSpent), 1200)
  }

  return (
    <div className="w-full max-w-2xl space-y-3">
      {tool === 'calc' && (
        <CalculatorModal showPT={!isBalancing && isMolarMass} onClose={() => setTool(null)} />
      )}
      {tool === 'pt' && (
        <PeriodicTableModal onClose={() => setTool(null)} />
      )}

      <div className="rounded-xl border-2 border-sky-600 bg-slate-900 px-5 py-5">
        <ToolButtons
          showCalc={!isBalancing}
          showPT={!isBalancing && isMolarMass}
          onOpenCalc={() => setTool('calc')}
          onOpenPT={() => setTool('pt')}
        />
        <span className="mb-3 inline-block rounded bg-slate-800/70 px-2.5 py-1 text-xs text-sky-300">
          {question.type === 'EQUATION_BALANCE' ? '⚗ Ecuación química' : '❓ Pregunta'}
        </span>
        <p className="text-slate-100" style={STEM_STYLE}>{chemFormat(question.stem)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isSel  = selectedId === opt.id
          const isCorr = opt.id === correctId
          const cls = answered
            ? isCorr
              ? 'border-emerald-600 bg-emerald-900/30 text-emerald-200 cursor-default'
              : isSel
                ? 'border-red-600 bg-red-900/30 text-red-300 cursor-default'
                : 'border-slate-700/40 text-slate-500 cursor-default opacity-50'
            : 'border-slate-600/60 bg-slate-800/60 text-slate-200 hover:border-sky-500 hover:bg-slate-700 cursor-pointer'

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              className={`rounded-xl border-2 px-4 py-4 text-left font-medium transition-colors ${cls}`}
              style={OPT_STYLE}
            >
              <span className="mr-2 font-bold opacity-60">{opt.id.toUpperCase()}.</span>
              {chemFormat(opt.text)}
              {answered && isCorr && <span className="ml-2 text-emerald-400">✓</span>}
            </button>
          )
        })}
      </div>

      {answered && isCorrect && (
        <p className="text-center font-bold text-emerald-400" style={FB_STYLE}>✓ ¡Correcto!</p>
      )}
      {answered && !isCorrect && (
        <div className="space-y-2 rounded-xl border-2 border-red-700 bg-red-950/40 px-5 py-4">
          <p className="font-bold text-red-400" style={OPT_STYLE}>✗ Respuesta incorrecta</p>
          {question.explanation && (
            <p className="text-slate-300" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
              {chemFormat(question.explanation)}
            </p>
          )}
          <button
            onClick={() => onAnswer(false, Math.floor((Date.now() - startTime) / 1000))}
            className="mt-1 rounded-lg bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            ▶ Continuar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Numeric Question ──────────────────────────────────────────────────────────

function NumericQuestion({ question, startTime, onAnswer }: Props) {
  const [value, setValue]         = useState('')
  const [answered, setAnswered]   = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [tool, setTool]           = useState<'calc' | 'pt' | null>(null)

  const isMolarMass = question.topic === 'molar_mass'
  const rows = [['7','8','9'], ['4','5','6'], ['1','2','3'], ['.','0','⌫']]

  const handleKey = (k: string) => {
    if (answered) return
    if (k === '⌫')      setValue(v => v.slice(0, -1))
    else if (k === '.') { if (!value.includes('.')) setValue(v => v + '.') }
    else                { if (value.length < 12) setValue(v => v + k) }
  }

  const handleConfirm = () => {
    if (answered) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    const ca = question.correctAnswer as { value: number; tolerance: number }
    const ok = Math.abs(num - ca.value) <= ca.tolerance
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    setAnswered(true)
    setIsCorrect(ok)
    gameEventBus.emit('answer:submitted', { questionId: 'generated', isCorrect: ok, timeSpent })
    if (ok) setTimeout(() => onAnswer(ok, timeSpent), 1200)
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      {tool === 'calc' && (
        <CalculatorModal
          showPT={isMolarMass}
          onInsert={(v) => { setValue(String(v)); setTool(null) }}
          onClose={() => setTool(null)}
        />
      )}
      {tool === 'pt' && (
        <PeriodicTableModal
          onElementSelect={(mass) => { setValue(String(mass)); setTool(null) }}
          onClose={() => setTool(null)}
        />
      )}

      <div className="rounded-xl border-2 border-sky-600 bg-slate-900 px-5 py-5">
        <ToolButtons
          showCalc
          showPT={isMolarMass}
          onOpenCalc={() => setTool('calc')}
          onOpenPT={() => setTool('pt')}
        />
        <p className="text-slate-100" style={STEM_STYLE}>{chemFormat(question.stem)}</p>
      </div>

      <div className="rounded-xl border-2 border-sky-500 bg-slate-950 py-3 text-center">
        <span className="font-mono font-bold text-sky-300" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>
          {value || '0'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rows.flat().map((k, i) => {
          const isOp = k === '⌫' || k === '.'
          return (
            <button
              key={i}
              onClick={() => handleKey(k)}
              disabled={answered}
              className={`rounded-lg py-3 text-xl font-bold transition-colors disabled:opacity-50 ${
                isOp
                  ? 'border border-sky-800/60 bg-sky-900/30 text-sky-300 hover:bg-sky-900/60'
                  : 'border border-slate-700/50 bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
            >{k}</button>
          )
        })}
      </div>

      {!answered && (
        <button
          onClick={handleConfirm}
          className="w-full rounded-xl bg-sky-700 py-3 font-bold text-white transition hover:bg-sky-600"
          style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)' }}
        >✓ Confirmar</button>
      )}

      {answered && isCorrect && (
        <p className="text-center font-bold text-emerald-400" style={FB_STYLE}>✓ ¡Correcto!</p>
      )}
      {answered && !isCorrect && (
        <div className="space-y-2 rounded-xl border-2 border-red-700 bg-red-950/40 px-5 py-4">
          <p className="font-bold text-red-400">✗ Respuesta incorrecta</p>
          {question.explanation && (
            <p className="text-sm text-slate-300">{chemFormat(question.explanation)}</p>
          )}
          <button
            onClick={() => onAnswer(false, Math.floor((Date.now() - startTime) / 1000))}
            className="rounded-lg bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >▶ Continuar</button>
        </div>
      )}
    </div>
  )
}
