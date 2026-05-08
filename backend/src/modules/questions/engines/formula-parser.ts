import { ELEMENTS } from './periodic-table.data'

export type AtomCount = Record<string, number>

/**
 * Parsea una fórmula química y devuelve el conteo de cada átomo.
 * Soporta: H2O, Ca(OH)2, Al2(SO4)3, Fe2(SO4)3, C6H12O6, Mg(NO3)2
 */
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

  if (stack.length !== 1) throw new Error(`Paréntesis sin cerrar en: "${formula}"`)
  return stack[0]
}

/**
 * Calcula la masa molar de un compuesto dado su fórmula química.
 * Devuelve el valor redondeado a 3 decimales.
 */
export function computeMolarMass(formula: string): number {
  const atoms = parseFormula(formula)
  const total = Object.entries(atoms).reduce((sum, [symbol, count]) => {
    return sum + ELEMENTS[symbol].mass * count
  }, 0)
  return Math.round(total * 1000) / 1000
}

/**
 * Genera una explicación paso a paso del cálculo de masa molar.
 */
export function explainMolarMass(formula: string): string {
  const atoms = parseFormula(formula)
  const parts = Object.entries(atoms).map(([symbol, count]) => {
    const mass = ELEMENTS[symbol].mass
    const subtotal = Math.round(mass * count * 1000) / 1000
    return `${symbol}(${count}): ${count} × ${mass} = ${subtotal}`
  })
  const total = computeMolarMass(formula)
  return `${parts.join(' + ')} = ${total} g/mol`
}
