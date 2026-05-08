import { parseFormula, type AtomCount } from './formula-parser'

export interface EquationSide {
  formula: string
  coefficient: number
}

/**
 * Verifica si una ecuación química está balanceada.
 * Retorna true si la cantidad de átomos es igual en ambos lados.
 */
export function isEquationBalanced(
  reactants: EquationSide[],
  products: EquationSide[],
): boolean {
  try {
    const leftAtoms = sumSides(reactants)
    const rightAtoms = sumSides(products)
    return atomCountsEqual(leftAtoms, rightAtoms)
  } catch {
    return false
  }
}

function sumSides(sides: EquationSide[]): AtomCount {
  const total: AtomCount = {}
  for (const side of sides) {
    const atoms = parseFormula(side.formula)
    for (const [el, count] of Object.entries(atoms)) {
      total[el] = (total[el] ?? 0) + count * side.coefficient
    }
  }
  return total
}

function atomCountsEqual(a: AtomCount, b: AtomCount): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((k) => a[k] === b[k])
}

/**
 * Dado el nombre de una respuesta en el formato "2H₂ + O₂ → 2H₂O",
 * retorna si coincide con la ecuación correcta comparando el texto normalizado.
 */
export function compareEquationText(answer: string, correct: string): boolean {
  const normalize = (s: string) =>
    s.replace(/\s+/g, '').replace(/→/g, '->').toLowerCase()
  return normalize(answer) === normalize(correct)
}
