import { computeMolarMass } from './formula-parser'

// ---------------------------------------------------------------------------
// Tipos base del motor
// ---------------------------------------------------------------------------

export interface BalancedEquation {
  reactants: ReactionSpecies[]
  products: ReactionSpecies[]
  /** Representación legible: "2H2 + O2 → 2H2O" */
  display: string
  /** Representación LaTeX */
  latex: string
}

export interface ReactionSpecies {
  formula: string
  coefficient: number
  name: string
}

// ---------------------------------------------------------------------------
// Banco de compuestos conocidos
// ---------------------------------------------------------------------------

export interface KnownCompound {
  formula: string
  name: string
  molarMass: number
}

export const COMPOUNDS: KnownCompound[] = [
  { formula: 'H2O',          name: 'agua',                molarMass: computeMolarMass('H2O')          },
  { formula: 'CO2',          name: 'dióxido de carbono',  molarMass: computeMolarMass('CO2')          },
  { formula: 'NaCl',         name: 'cloruro de sodio',    molarMass: computeMolarMass('NaCl')         },
  { formula: 'NH3',          name: 'amoniaco',            molarMass: computeMolarMass('NH3')          },
  { formula: 'HCl',          name: 'ácido clorhídrico',   molarMass: computeMolarMass('HCl')          },
  { formula: 'H2SO4',        name: 'ácido sulfúrico',     molarMass: computeMolarMass('H2SO4')        },
  { formula: 'NaOH',         name: 'hidróxido de sodio',  molarMass: computeMolarMass('NaOH')         },
  { formula: 'KOH',          name: 'hidróxido de potasio',molarMass: computeMolarMass('KOH')         },
  { formula: 'CaCO3',        name: 'carbonato de calcio', molarMass: computeMolarMass('CaCO3')        },
  { formula: 'MgO',          name: 'óxido de magnesio',   molarMass: computeMolarMass('MgO')          },
  { formula: 'Al2O3',        name: 'óxido de aluminio',   molarMass: computeMolarMass('Al2O3')        },
  { formula: 'Fe2O3',        name: 'óxido de hierro(III)',molarMass: computeMolarMass('Fe2O3')        },
  { formula: 'CuSO4',        name: 'sulfato de cobre(II)',molarMass: computeMolarMass('CuSO4')        },
  { formula: 'Ca(OH)2',      name: 'hidróxido de calcio', molarMass: computeMolarMass('Ca(OH)2')      },
  { formula: 'Na2SO4',       name: 'sulfato de sodio',    molarMass: computeMolarMass('Na2SO4')       },
  { formula: 'C6H12O6',      name: 'glucosa',             molarMass: computeMolarMass('C6H12O6')      },
  { formula: 'CH4',          name: 'metano',              molarMass: computeMolarMass('CH4')          },
  { formula: 'C2H5OH',       name: 'etanol',              molarMass: computeMolarMass('C2H5OH')       },
  { formula: 'HNO3',         name: 'ácido nítrico',       molarMass: computeMolarMass('HNO3')         },
  { formula: 'Na2CO3',       name: 'carbonato de sodio',  molarMass: computeMolarMass('Na2CO3')       },
  { formula: 'KCl',          name: 'cloruro de potasio',  molarMass: computeMolarMass('KCl')          },
  { formula: 'FeCl3',        name: 'cloruro de hierro(III)', molarMass: computeMolarMass('FeCl3')     },
  { formula: 'Mg(NO3)2',     name: 'nitrato de magnesio', molarMass: computeMolarMass('Mg(NO3)2')     },
  { formula: 'Al2(SO4)3',    name: 'sulfato de aluminio', molarMass: computeMolarMass('Al2(SO4)3')    },
  // Elementos y compuestos simples presentes en ecuaciones balanceadas
  { formula: 'H2',    name: 'hidrógeno',             molarMass: computeMolarMass('H2')    },
  { formula: 'O2',    name: 'oxígeno',               molarMass: computeMolarMass('O2')    },
  { formula: 'N2',    name: 'nitrógeno',             molarMass: computeMolarMass('N2')    },
  { formula: 'CO',    name: 'monóxido de carbono',   molarMass: computeMolarMass('CO')    },
  { formula: 'Fe',    name: 'hierro',                molarMass: computeMolarMass('Fe')    },
  { formula: 'CaO',   name: 'óxido de calcio',       molarMass: computeMolarMass('CaO')   },
  { formula: 'Na',    name: 'sodio',                 molarMass: computeMolarMass('Na')    },
  { formula: 'Mg',    name: 'magnesio',              molarMass: computeMolarMass('Mg')    },
  { formula: 'Al',    name: 'aluminio',              molarMass: computeMolarMass('Al')    },
  { formula: 'MgCl2', name: 'cloruro de magnesio',   molarMass: computeMolarMass('MgCl2') },
  { formula: 'H2O2',  name: 'peróxido de hidrógeno', molarMass: computeMolarMass('H2O2')  },
]

// ---------------------------------------------------------------------------
// Banco de ecuaciones balanceadas
// ---------------------------------------------------------------------------

export const BALANCED_EQUATIONS: BalancedEquation[] = [
  {
    reactants: [
      { formula: 'H2', coefficient: 2, name: 'hidrógeno' },
      { formula: 'O2', coefficient: 1, name: 'oxígeno' },
    ],
    products: [{ formula: 'H2O', coefficient: 2, name: 'agua' }],
    display: '2H₂ + O₂ → 2H₂O',
    latex: '2H_2 + O_2 \\rightarrow 2H_2O',
  },
  {
    reactants: [
      { formula: 'CH4', coefficient: 1, name: 'metano' },
      { formula: 'O2', coefficient: 2, name: 'oxígeno' },
    ],
    products: [
      { formula: 'CO2', coefficient: 1, name: 'dióxido de carbono' },
      { formula: 'H2O', coefficient: 2, name: 'agua' },
    ],
    display: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    latex: 'CH_4 + 2O_2 \\rightarrow CO_2 + 2H_2O',
  },
  {
    reactants: [
      { formula: 'N2', coefficient: 1, name: 'nitrógeno' },
      { formula: 'H2', coefficient: 3, name: 'hidrógeno' },
    ],
    products: [{ formula: 'NH3', coefficient: 2, name: 'amoniaco' }],
    display: 'N₂ + 3H₂ → 2NH₃',
    latex: 'N_2 + 3H_2 \\rightarrow 2NH_3',
  },
  {
    reactants: [
      { formula: 'Na', coefficient: 2, name: 'sodio' },
      { formula: 'Cl2', coefficient: 1, name: 'cloro' },
    ],
    products: [{ formula: 'NaCl', coefficient: 2, name: 'cloruro de sodio' }],
    display: '2Na + Cl₂ → 2NaCl',
    latex: '2Na + Cl_2 \\rightarrow 2NaCl',
  },
  {
    reactants: [
      { formula: 'Fe2O3', coefficient: 1, name: 'óxido de hierro(III)' },
      { formula: 'CO', coefficient: 3, name: 'monóxido de carbono' },
    ],
    products: [
      { formula: 'Fe', coefficient: 2, name: 'hierro' },
      { formula: 'CO2', coefficient: 3, name: 'dióxido de carbono' },
    ],
    display: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂',
    latex: 'Fe_2O_3 + 3CO \\rightarrow 2Fe + 3CO_2',
  },
  {
    reactants: [
      { formula: 'CaCO3', coefficient: 1, name: 'carbonato de calcio' },
    ],
    products: [
      { formula: 'CaO', coefficient: 1, name: 'óxido de calcio' },
      { formula: 'CO2', coefficient: 1, name: 'dióxido de carbono' },
    ],
    display: 'CaCO₃ → CaO + CO₂',
    latex: 'CaCO_3 \\rightarrow CaO + CO_2',
  },
  {
    reactants: [
      { formula: 'Mg', coefficient: 1, name: 'magnesio' },
      { formula: 'HCl', coefficient: 2, name: 'ácido clorhídrico' },
    ],
    products: [
      { formula: 'MgCl2', coefficient: 1, name: 'cloruro de magnesio' },
      { formula: 'H2', coefficient: 1, name: 'hidrógeno' },
    ],
    display: 'Mg + 2HCl → MgCl₂ + H₂',
    latex: 'Mg + 2HCl \\rightarrow MgCl_2 + H_2',
  },
  {
    reactants: [
      { formula: 'Al', coefficient: 4, name: 'aluminio' },
      { formula: 'O2', coefficient: 3, name: 'oxígeno' },
    ],
    products: [{ formula: 'Al2O3', coefficient: 2, name: 'óxido de aluminio' }],
    display: '4Al + 3O₂ → 2Al₂O₃',
    latex: '4Al + 3O_2 \\rightarrow 2Al_2O_3',
  },
  {
    reactants: [
      { formula: 'NaOH', coefficient: 1, name: 'hidróxido de sodio' },
      { formula: 'HCl', coefficient: 1, name: 'ácido clorhídrico' },
    ],
    products: [
      { formula: 'NaCl', coefficient: 1, name: 'cloruro de sodio' },
      { formula: 'H2O', coefficient: 1, name: 'agua' },
    ],
    display: 'NaOH + HCl → NaCl + H₂O',
    latex: 'NaOH + HCl \\rightarrow NaCl + H_2O',
  },
  {
    reactants: [
      { formula: 'H2O2', coefficient: 2, name: 'peróxido de hidrógeno' },
    ],
    products: [
      { formula: 'H2O', coefficient: 2, name: 'agua' },
      { formula: 'O2', coefficient: 1, name: 'oxígeno' },
    ],
    display: '2H₂O₂ → 2H₂O + O₂',
    latex: '2H_2O_2 \\rightarrow 2H_2O + O_2',
  },
]

// ---------------------------------------------------------------------------
// Funciones de cálculo
// ---------------------------------------------------------------------------

/** Convierte moles a gramos: n × M */
export function molesToGrams(moles: number, molarMass: number): number {
  return round3(moles * molarMass)
}

/** Convierte gramos a moles: m / M */
export function gramsToMoles(grams: number, molarMass: number): number {
  return round3(grams / molarMass)
}

/**
 * Calcula la cantidad de producto dado reactivo usando relación molar.
 * @param fromMoles  moles del reactivo/producto de origen
 * @param fromCoeff  coeficiente del reactivo en la ecuación
 * @param toCoeff    coeficiente del producto en la ecuación
 */
export function stoichiometricMoles(
  fromMoles: number,
  fromCoeff: number,
  toCoeff: number,
): number {
  return round3(fromMoles * (toCoeff / fromCoeff))
}

/**
 * Identifica el reactivo limitante entre dos reactivos.
 * @returns índice (0 o 1) del reactivo limitante
 */
export function findLimitingReagentIndex(
  moles: [number, number],
  coefficients: [number, number],
): 0 | 1 {
  const ratio0 = moles[0] / coefficients[0]
  const ratio1 = moles[1] / coefficients[1]
  return ratio0 <= ratio1 ? 0 : 1
}

/**
 * Calcula el rendimiento porcentual.
 * rendimiento% = (rendimiento_real / rendimiento_teórico) × 100
 */
export function percentYield(actual: number, theoretical: number): number {
  if (theoretical === 0) return 0
  return round3((actual / theoretical) * 100)
}

/** Redondea a 3 decimales */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** Redondea a n decimales */
export function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}
