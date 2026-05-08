import { ELEMENTS } from './periodic-table.data'

export type AtomCount = Record<string, number>

/** Parsea una fórmula química con soporte para paréntesis */
export function parseFormula(formula: string): AtomCount {
  const stack: AtomCount[] = [{}]
  let i = 0

  while (i < formula.length) {
    const ch = formula[i]

    if (ch === '(') {
      stack.push({})
      i++
      continue
    }

    if (ch === ')') {
      i++
      let numStr = ''
      while (i < formula.length && /\d/.test(formula[i])) numStr += formula[i++]
      const mult = numStr ? parseInt(numStr, 10) : 1

      const group = stack.pop()!
      const top = stack[stack.length - 1]
      for (const [el, cnt] of Object.entries(group)) {
        top[el] = (top[el] ?? 0) + cnt * mult
      }
      continue
    }

    if (/[A-Z]/.test(ch)) {
      let symbol = ch
      i++
      while (i < formula.length && /[a-z]/.test(formula[i])) symbol += formula[i++]

      if (!ELEMENTS[symbol]) throw new Error(`Elemento desconocido: "${symbol}"`)

      let numStr = ''
      while (i < formula.length && /\d/.test(formula[i])) numStr += formula[i++]
      const count = numStr ? parseInt(numStr, 10) : 1

      const top = stack[stack.length - 1]
      top[symbol] = (top[symbol] ?? 0) + count
      continue
    }

    i++
  }

  return stack[0]
}

/** Calcula la masa molar de un compuesto */
export function computeMolarMass(formula: string): number {
  const atoms = parseFormula(formula)
  const total = Object.entries(atoms).reduce((sum, [symbol, count]) => {
    return sum + ELEMENTS[symbol].mass * count
  }, 0)
  return Math.round(total * 1000) / 1000
}

/** Convierte una fórmula química a formato HTML con subíndices */
export function formulaToHtml(formula: string): string {
  return formula
    .replace(/\((\w+)\)(\d+)/g, '($1)<sub>$2</sub>')
    .replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>')
}

/** Convierte una fórmula química a LaTeX */
export function formulaToLatex(formula: string): string {
  return formula
    .replace(/\(([^)]+)\)(\d+)/g, '($1)_{$2}')
    .replace(/([A-Z][a-z]?)(\d+)/g, '$1_{$2}')
}
