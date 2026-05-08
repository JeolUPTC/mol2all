import { computeMolarMass, parseFormula } from './formula-parser'
import { ELEMENTS } from './periodic-table.data'

export { computeMolarMass }

/** Resultado detallado del cálculo de masa molar */
export interface MolarMassBreakdown {
  formula: string
  totalMass: number
  atoms: Array<{ symbol: string; name: string; count: number; atomicMass: number; subtotal: number }>
}

export function getMolarMassBreakdown(formula: string): MolarMassBreakdown {
  const atoms = parseFormula(formula)
  const breakdown = Object.entries(atoms).map(([symbol, count]) => {
    const el = ELEMENTS[symbol]
    return {
      symbol,
      name: el.name,
      count,
      atomicMass: el.mass,
      subtotal: Math.round(el.mass * count * 1000) / 1000,
    }
  })
  const totalMass = breakdown.reduce((s, a) => s + a.subtotal, 0)
  return { formula, totalMass: Math.round(totalMass * 1000) / 1000, atoms: breakdown }
}

/** Valida si una respuesta numérica está dentro de la tolerancia */
export function isNumericAnswerCorrect(
  submitted: number,
  correct: number,
  tolerance = 0.01,
): boolean {
  return Math.abs(submitted - correct) <= tolerance
}
