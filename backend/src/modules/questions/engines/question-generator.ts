import {
  COMPOUNDS,
  BALANCED_EQUATIONS,
  molesToGrams,
  gramsToMoles,
  stoichiometricMoles,
  findLimitingReagentIndex,
  percentYield,
  round3,
  roundTo,
  type KnownCompound,
  type BalancedEquation,
} from './stoichiometry.engine'
import { explainMolarMass } from './formula-parser'

// ---------------------------------------------------------------------------
// Tipos de salida del generador
// ---------------------------------------------------------------------------

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'NUMERIC_INPUT'
  | 'EQUATION_BALANCE'
  | 'MATCH_PAIRS'

export interface QuestionOption {
  id: string
  text: string
  latex?: string
}

export interface GeneratedQuestion {
  type: QuestionType
  topic: string
  stem: string
  latexFormula: string | null
  options: QuestionOption[] | null
  correctAnswer: unknown
  explanation: string
  difficulty: number
}

// ---------------------------------------------------------------------------
// Utilidades del generador
// ---------------------------------------------------------------------------

let seed = Date.now()

/** PRNG determinista simple (LCG) */
function rand(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff
  return (seed >>> 0) / 0xffffffff
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

function shuffleOptions(opts: QuestionOption[]): QuestionOption[] {
  const arr = [...opts]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Genera 3 distractores plausibles para un valor numérico */
function generateNumericDistractors(
  correct: number,
  count = 3,
  minDelta = 0.05,
): number[] {
  const distractors = new Set<number>()
  const variants = [
    round3(correct * 0.5),
    round3(correct * 2),
    round3(correct + correct * 0.15),
    round3(correct - correct * 0.15),
    round3(correct + correct * 0.3),
    roundTo(correct, 0),
    round3(correct * 1.1),
    round3(correct * 0.9),
    round3(correct + 2),
    round3(correct - 2),
  ]

  for (const v of variants) {
    if (v > 0 && Math.abs(v - correct) > minDelta) {
      distractors.add(v)
    }
    if (distractors.size >= count) break
  }

  return Array.from(distractors).slice(0, count)
}

/** Construye las opciones MC a partir del valor correcto y distractores */
function buildMCOptions(
  correct: number,
  unit: string,
  distractors: number[],
): { options: QuestionOption[]; correctId: string } {
  const ids = ['a', 'b', 'c', 'd']
  const all = [correct, ...distractors.slice(0, 3)]
  const shuffled = all
    .map((v, i) => ({ v, sort: rand() + i * 0.0001 }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.v)

  const correctId = ids[shuffled.indexOf(correct)]
  const options: QuestionOption[] = shuffled.map((v, i) => ({
    id: ids[i],
    text: `${v} ${unit}`,
  }))

  return { options, correctId }
}

// ---------------------------------------------------------------------------
// Generadores por tema
// ---------------------------------------------------------------------------

// ---- MASA MOLAR ------------------------------------------------------------

function generateMolarMassQuestion(difficulty: 1 | 2 | 3): GeneratedQuestion {
  const pool = difficulty === 1
    ? COMPOUNDS.filter((c) => {
        if (c.formula.includes('(') || c.formula.length > 6) return false
        // Require at least 2 distinct element symbols (no pure elements/diatomics)
        const elements = new Set((c.formula.match(/[A-Z][a-z]?/g) ?? []))
        return elements.size >= 2
      })
    : difficulty === 2
    ? COMPOUNDS.filter((c) => !c.formula.includes('('))
    : COMPOUNDS

  const compound = pickRandom(pool)
  const mm = compound.molarMass
  const explanation = explainMolarMass(compound.formula)

  if (difficulty === 1) {
    // Pregunta directa: ¿Cuál es la masa molar de X?
    const distractors = generateNumericDistractors(mm)
    const { options, correctId } = buildMCOptions(mm, 'g/mol', distractors)

    return {
      type: 'MULTIPLE_CHOICE',
      topic: 'molar_mass',
      stem: `¿Cuál es la masa molar del ${compound.name} (${compound.formula})?`,
      latexFormula: toLatex(compound.formula),
      options: shuffleOptions(options),
      correctAnswer: { id: correctId },
      explanation,
      difficulty: 1,
    }
  }

  if (difficulty === 2) {
    // Conversión mol → g
    const moles = pickRandom([0.5, 1, 2, 3, 4, 5, 0.25])
    const grams = molesToGrams(moles, mm)
    const distractors = generateNumericDistractors(grams)
    const { options, correctId } = buildMCOptions(grams, 'g', distractors)

    return {
      type: 'MULTIPLE_CHOICE',
      topic: 'molar_mass',
      stem: `¿Cuántos gramos hay en ${moles} mol de ${compound.name} (${compound.formula})?`,
      latexFormula: toLatex(compound.formula),
      options: shuffleOptions(options),
      correctAnswer: { id: correctId },
      explanation: `${moles} mol × ${mm} g/mol = ${grams} g`,
      difficulty: 2,
    }
  }

  // difficulty === 3: conversión g → mol (numérico)
  const grams = round3(pickRandom([18, 22, 36, 44, 58, 88, 100, 180]) * (rand() * 0.5 + 0.5))
  const moles = gramsToMoles(grams, mm)

  return {
    type: 'NUMERIC_INPUT',
    topic: 'molar_mass',
    stem: `¿Cuántos moles hay en ${grams} g de ${compound.name} (${compound.formula})? Responde con 3 decimales.`,
    latexFormula: toLatex(compound.formula),
    options: null,
    correctAnswer: { value: moles, tolerance: 0.01 },
    explanation: `${grams} g ÷ ${mm} g/mol = ${moles} mol`,
    difficulty: 3,
  }
}

// ---- BALANCEO --------------------------------------------------------------

function generateBalancingQuestion(difficulty: 1 | 2 | 3): GeneratedQuestion {
  if (difficulty === 1) return generateBalancingCoeffInput()
  // Difficulty 2: mix numpad-entry and set-selection so the player can't rely on guessing
  if (difficulty === 2 && rand() < 0.5) return generateBalancingCoeffInput()
  return generateBalancingCoeffSelect(difficulty)
}

// Difficulty 1 — NUMERIC_INPUT: enter the missing coefficient
function generateBalancingCoeffInput(): GeneratedQuestion {
  const pool = BALANCED_EQUATIONS.filter((eq) =>
    [...eq.reactants, ...eq.products].some((s) => s.coefficient > 1),
  )
  const eq = pickRandom(pool)
  const candidates = [...eq.reactants, ...eq.products].filter((s) => s.coefficient > 1)
  const blank = pickRandom(candidates)
  const unbalanced = buildUnbalancedDisplay(eq)

  return {
    type: 'NUMERIC_INPUT',
    topic: 'balancing',
    stem: `Completa el balance:\n${unbalanced}\n¿Cuál es el coeficiente de ${blank.name} (${blank.formula})?`,
    latexFormula: eq.latex,
    options: null,
    correctAnswer: { value: blank.coefficient, tolerance: 0 },
    explanation: `La ecuación balanceada es: ${eq.display}. El coeficiente de ${blank.name} es ${blank.coefficient}.`,
    difficulty: 1,
  }
}

// Difficulty 2–3 — EQUATION_BALANCE: pick the correct coefficient set
function generateBalancingCoeffSelect(difficulty: 2 | 3): GeneratedQuestion {
  const pool =
    difficulty === 2
      ? BALANCED_EQUATIONS.filter((eq) => {
          const coeffs = [...eq.reactants, ...eq.products].map((s) => s.coefficient)
          return Math.max(...coeffs) <= 2 && coeffs.some((c) => c > 1)
        })
      : BALANCED_EQUATIONS.filter((eq) => {
          const coeffs = [...eq.reactants, ...eq.products].map((s) => s.coefficient)
          return Math.max(...coeffs) >= 3
        })

  const eq = pool.length > 0 ? pickRandom(pool) : pickRandom(BALANCED_EQUATIONS)
  const allSpecies = [...eq.reactants, ...eq.products]
  const correctCoeffs = allSpecies.map((s) => s.coefficient)
  const correctSet = correctCoeffs.join(' : ')
  const speciesOrder = allSpecies.map((s) => s.formula).join(', ')
  const unbalanced = buildUnbalancedDisplay(eq)

  const wrongSets = generateWrongCoeffSets(correctCoeffs)
  const options: QuestionOption[] = shuffleOptions([
    { id: 'a', text: correctSet },
    ...wrongSets.slice(0, 3).map((txt, i) => ({ id: (['b', 'c', 'd'] as const)[i], text: txt })),
  ])
  const correctId = options.find((o) => o.text === correctSet)!.id

  return {
    type: 'EQUATION_BALANCE',
    topic: 'balancing',
    stem: `Elige los coeficientes de balance:\n${unbalanced}\n(orden: ${speciesOrder})`,
    latexFormula: eq.latex,
    options,
    correctAnswer: { id: correctId },
    explanation: `La ecuación balanceada es: ${eq.display}. Coeficientes en orden: ${correctSet}.`,
    difficulty,
  }
}

function buildUnbalancedDisplay(eq: BalancedEquation): string {
  const reactants = eq.reactants.map((r) => r.formula).join(' + ')
  const products = eq.products.map((p) => p.formula).join(' + ')
  return `${reactants} → ${products}`
}

function generateWrongCoeffSets(correct: number[]): string[] {
  const correctStr = correct.join(' : ')
  const candidates: string[] = []

  const add = (variant: number[]) => {
    const s = variant.join(' : ')
    if (s !== correctStr && !candidates.includes(s)) candidates.push(s)
  }

  // All-1s
  add(correct.map(() => 1))

  // Increment each position until we have enough
  for (let i = 0; i < correct.length && candidates.length < 3; i++) {
    const v = [...correct]; v[i] += 1; add(v)
  }

  // Decrement positions that are > 1
  for (let i = 0; i < correct.length && candidates.length < 3; i++) {
    if (correct[i] > 1) { const v = [...correct]; v[i] -= 1; add(v) }
  }

  // Swap first two if different
  if (correct.length >= 2 && correct[0] !== correct[1]) {
    const v = [...correct]; [v[0], v[1]] = [v[1], v[0]]; add(v)
  }

  // Double all, then increment all as final fallbacks
  add(correct.map((c) => c * 2))
  add(correct.map((c) => c + 1))

  return candidates.slice(0, 3)
}

// ---- ESTEQUIOMETRÍA --------------------------------------------------------

function generateStoichiometryQuestion(difficulty: 1 | 2 | 3): GeneratedQuestion {
  const eq = pickRandom(BALANCED_EQUATIONS)

  if (difficulty <= 2) {
    // Mol → mol
    const fromSpecies = pickRandom(eq.reactants)
    const toSpecies = pickRandom(eq.products)
    const fromMoles = pickRandom([1, 2, 3, 4, 0.5])
    const toMoles = stoichiometricMoles(fromMoles, fromSpecies.coefficient, toSpecies.coefficient)

    const distractors = generateNumericDistractors(toMoles)
    const { options, correctId } = buildMCOptions(toMoles, 'mol', distractors)

    return {
      type: 'MULTIPLE_CHOICE',
      topic: 'stoichiometry',
      stem: `En la reacción ${eq.display}, si reaccionan ${fromMoles} mol de ${fromSpecies.name} (${fromSpecies.formula}), ¿cuántos moles de ${toSpecies.name} (${toSpecies.formula}) se producen?`,
      latexFormula: eq.latex,
      options: shuffleOptions(options),
      correctAnswer: { id: correctId },
      explanation: `Usando la relación molar: ${fromMoles} mol × (${toSpecies.coefficient} / ${fromSpecies.coefficient}) = ${toMoles} mol`,
      difficulty,
    }
  }

  // difficulty 3: masa → masa
  const fromSpecies = pickRandom(eq.reactants)
  const toSpecies = pickRandom(eq.products)

  const fromCompound = COMPOUNDS.find((c) => c.formula === fromSpecies.formula)
  const toCompound = COMPOUNDS.find((c) => c.formula === toSpecies.formula)

  if (!fromCompound || !toCompound) {
    return generateStoichiometryQuestion(2) // fallback
  }

  const fromGrams = round3(pickRandom([10, 20, 36, 44, 50, 100]))
  const fromMoles = gramsToMoles(fromGrams, fromCompound.molarMass)
  const toMoles = stoichiometricMoles(fromMoles, fromSpecies.coefficient, toSpecies.coefficient)
  const toGrams = molesToGrams(toMoles, toCompound.molarMass)

  return {
    type: 'NUMERIC_INPUT',
    topic: 'stoichiometry',
    stem: `En la reacción ${eq.display}, ¿cuántos gramos de ${toSpecies.name} (${toSpecies.formula}) se producen a partir de ${fromGrams} g de ${fromSpecies.name} (${fromSpecies.formula})?`,
    latexFormula: eq.latex,
    options: null,
    correctAnswer: { value: toGrams, tolerance: 0.5 },
    explanation: `${fromGrams} g ÷ ${fromCompound.molarMass} g/mol = ${fromMoles} mol → × (${toSpecies.coefficient}/${fromSpecies.coefficient}) = ${toMoles} mol → × ${toCompound.molarMass} g/mol = ${toGrams} g`,
    difficulty: 3,
  }
}

// ---- REACTIVO LÍMITE -------------------------------------------------------

function generateLimitingReagentQuestion(difficulty: 1 | 2 | 3): GeneratedQuestion {
  // Solo ecuaciones con exactamente 2 reactivos
  const eqs = BALANCED_EQUATIONS.filter((e) => e.reactants.length === 2)
  const eq = pickRandom(eqs)

  const [r0, r1] = eq.reactants
  const [c0, c1] = [r0.coefficient, r1.coefficient]

  // Generar cantidades donde uno sea limitante de forma no obvia
  const limitingIdx = rand() > 0.5 ? 0 : 1
  const excess = round3(pickRandom([1.5, 2, 2.5, 3]))
  const mol0 = limitingIdx === 0
    ? round3(c0 * pickRandom([1, 1.5, 2]))
    : round3(c0 * excess)
  const mol1 = limitingIdx === 1
    ? round3(c1 * pickRandom([1, 1.5, 2]))
    : round3(c1 * excess)

  const actualLimiting = findLimitingReagentIndex([mol0, mol1], [c0, c1])
  const limitingName = actualLimiting === 0 ? r0.name : r1.name
  const limitingFormula = actualLimiting === 0 ? r0.formula : r1.formula

  const options: QuestionOption[] = shuffleOptions([
    { id: 'a', text: `${r0.name} (${r0.formula})` },
    { id: 'b', text: `${r1.name} (${r1.formula})` },
    { id: 'c', text: 'Ambos se consumen en partes iguales' },
    { id: 'd', text: 'No hay reactivo limitante' },
  ])

  const correctId = options.find((o) => o.text === `${limitingName} (${limitingFormula})`)!.id

  const ratio0 = round3(mol0 / c0)
  const ratio1 = round3(mol1 / c1)

  return {
    type: 'MULTIPLE_CHOICE',
    topic: 'limiting_reagent',
    stem: `En la reacción ${eq.display}, se dispone de ${mol0} mol de ${r0.name} y ${mol1} mol de ${r1.name}. ¿Cuál es el reactivo limitante?`,
    latexFormula: eq.latex,
    options,
    correctAnswer: { id: correctId },
    explanation: `Divide moles entre coeficiente: ${r0.formula}: ${mol0}/${c0} = ${ratio0}; ${r1.formula}: ${mol1}/${c1} = ${ratio1}. El menor cociente es ${limitingFormula} → es el reactivo limitante.`,
    difficulty,
  }
}

// ---- RENDIMIENTO PORCENTUAL ------------------------------------------------

function generateYieldQuestion(difficulty: 1 | 2 | 3): GeneratedQuestion {
  const compound = pickRandom(COMPOUNDS.slice(0, 12))

  if (difficulty === 1) {
    // Porcentaje directo con valores enteros
    const theoretical = pickRandom([50, 80, 100, 120, 200])
    const yieldPct = pickRandom([60, 70, 75, 80, 85, 90, 95])
    const actual = round3((yieldPct / 100) * theoretical)

    const distractors = generateNumericDistractors(yieldPct, 3, 1)
    const { options, correctId } = buildMCOptions(yieldPct, '%', distractors)

    return {
      type: 'MULTIPLE_CHOICE',
      topic: 'yield',
      stem: `Una reacción que produce ${compound.name} tiene un rendimiento teórico de ${theoretical} g pero solo se obtienen ${actual} g. ¿Cuál es el rendimiento porcentual?`,
      latexFormula: null,
      options: shuffleOptions(options),
      correctAnswer: { id: correctId },
      explanation: `Rendimiento% = (${actual} / ${theoretical}) × 100 = ${yieldPct}%`,
      difficulty: 1,
    }
  }

  if (difficulty === 2) {
    // Calcular rendimiento real dado el porcentaje
    const theoretical = round3(pickRandom([40, 60, 80, 100, 150]) * (1 + rand() * 0.2))
    const yieldPct = pickRandom([65, 72, 78, 83, 88, 92])
    const actual = round3((yieldPct / 100) * theoretical)

    const distractors = generateNumericDistractors(actual, 3, 0.5)
    const { options, correctId } = buildMCOptions(actual, 'g', distractors)

    return {
      type: 'MULTIPLE_CHOICE',
      topic: 'yield',
      stem: `Si el rendimiento porcentual de una reacción que produce ${compound.name} es del ${yieldPct}% y el rendimiento teórico es de ${theoretical} g, ¿cuántos gramos se obtienen realmente?`,
      latexFormula: null,
      options: shuffleOptions(options),
      correctAnswer: { id: correctId },
      explanation: `Rendimiento real = ${yieldPct}% × ${theoretical} g = ${actual} g`,
      difficulty: 2,
    }
  }

  // difficulty 3: calcular rendimiento teórico via estequiometría
  const eq = pickRandom(BALANCED_EQUATIONS.filter((e) => e.products.length >= 1))
  const toSpecies = eq.products[0]
  const fromSpecies = eq.reactants[0]
  const fromCompound = COMPOUNDS.find((c) => c.formula === fromSpecies.formula)
  const toCompound = COMPOUNDS.find((c) => c.formula === toSpecies.formula)

  if (!fromCompound || !toCompound) return generateYieldQuestion(2)

  const fromGrams = round3(pickRandom([20, 40, 50, 100]))
  const fromMoles = gramsToMoles(fromGrams, fromCompound.molarMass)
  const toMolesTheo = stoichiometricMoles(fromMoles, fromSpecies.coefficient, toSpecies.coefficient)
  const theoreticalGrams = molesToGrams(toMolesTheo, toCompound.molarMass)
  const yieldPct = pickRandom([70, 75, 80, 85, 88])
  const actualGrams = round3((yieldPct / 100) * theoreticalGrams)
  const resultYield = percentYield(actualGrams, theoreticalGrams)

  return {
    type: 'NUMERIC_INPUT',
    topic: 'yield',
    stem: `En la reacción ${eq.display} se parten de ${fromGrams} g de ${fromSpecies.name}. Se obtienen ${actualGrams} g de ${toSpecies.name}. ¿Cuál es el rendimiento porcentual? (1 decimal)`,
    latexFormula: eq.latex,
    options: null,
    correctAnswer: { value: resultYield, tolerance: 1 },
    explanation: `Rendimiento teórico: ${theoreticalGrams} g → Rendimiento% = (${actualGrams} / ${theoreticalGrams}) × 100 = ${resultYield}%`,
    difficulty: 3,
  }
}

// ---------------------------------------------------------------------------
// API pública del generador
// ---------------------------------------------------------------------------

type Topic = 'molar_mass' | 'balancing' | 'stoichiometry' | 'limiting_reagent' | 'yield'

export function generateQuestion(topic: Topic, difficulty: 1 | 2 | 3): GeneratedQuestion {
  seed = Date.now() + Math.floor(Math.random() * 10000)

  switch (topic) {
    case 'molar_mass':      return generateMolarMassQuestion(difficulty)
    case 'balancing':       return generateBalancingQuestion(difficulty)
    case 'stoichiometry':   return generateStoichiometryQuestion(difficulty)
    case 'limiting_reagent':return generateLimitingReagentQuestion(difficulty)
    case 'yield':           return generateYieldQuestion(difficulty)
    default:                return generateMolarMassQuestion(difficulty)
  }
}

export function generateBatch(
  topic: Topic,
  difficulty: 1 | 2 | 3,
  count: number,
): GeneratedQuestion[] {
  const results: GeneratedQuestion[] = []
  const usedKeys = new Set<string>()

  for (let i = 0; i < count; i++) {
    let q = generateQuestion(topic, difficulty)
    // Up to 4 retries to avoid repeating the same question stem
    for (let retry = 0; retry < 4; retry++) {
      if (!usedKeys.has(q.stem.slice(0, 100))) break
      q = generateQuestion(topic, difficulty)
    }
    usedKeys.add(q.stem.slice(0, 100))
    results.push(q)
  }

  return results
}

// ---------------------------------------------------------------------------
// Validación de respuestas
// ---------------------------------------------------------------------------

export function validateAnswer(
  questionType: QuestionType,
  correctAnswer: unknown,
  submittedAnswer: unknown,
): boolean {
  if (questionType === 'MULTIPLE_CHOICE' || questionType === 'EQUATION_BALANCE') {
    const ca = correctAnswer as { id: string }
    const sa = submittedAnswer as { id: string }
    return ca?.id === sa?.id
  }

  if (questionType === 'NUMERIC_INPUT') {
    const ca = correctAnswer as { value: number; tolerance: number }
    const sa = submittedAnswer as { value: number }
    if (typeof sa?.value !== 'number') return false
    return Math.abs(sa.value - ca.value) <= ca.tolerance
  }

  return JSON.stringify(correctAnswer) === JSON.stringify(submittedAnswer)
}

// ---------------------------------------------------------------------------
// Helpers de display
// ---------------------------------------------------------------------------

function toLatex(formula: string): string {
  return formula.replace(/(\d+)/g, '_{$1}')
}
