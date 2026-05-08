/** Convierte moles a gramos */
export function molesToGrams(moles: number, molarMass: number): number {
  return round3(moles * molarMass)
}

/** Convierte gramos a moles */
export function gramsToMoles(grams: number, molarMass: number): number {
  return round3(grams / molarMass)
}

/** Calcula moles de producto a partir de moles de reactivo */
export function stoichiometricMoles(
  fromMoles: number,
  fromCoeff: number,
  toCoeff: number,
): number {
  return round3(fromMoles * (toCoeff / fromCoeff))
}

/** Calcula rendimiento porcentual */
export function percentYield(actual: number, theoretical: number): number {
  if (theoretical === 0) return 0
  return round3((actual / theoretical) * 100)
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}
