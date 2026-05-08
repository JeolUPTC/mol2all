export interface TopicTheory {
  title: string
  subtitle: string
  concept: string
  formula: string
  formulaLabel: string
  example: string
  tips: string[]
}

export const THEORY: Record<string, TopicTheory> = {
  molar_mass: {
    title: 'Masa Molar',
    subtitle: 'Masa de un mol de sustancia (g/mol)',
    concept:
      'La masa molar (M) es la masa de 6.022 × 10²³ partículas de una sustancia. ' +
      'Se calcula sumando las masas atómicas de todos los átomos de la fórmula.',
    formula: 'M = Σ (masa atómica × nº de átomos)',
    formulaLabel: 'Unidad: g/mol',
    example: 'H₂O → M = 2(1.008) + 15.999 = 18.015 g/mol',
    tips: [
      'Consulta la tabla periódica para cada masa atómica',
      'Multiplica la masa atómica por el subíndice del elemento',
      'Suma todos los valores obtenidos',
    ],
  },
  balancing: {
    title: 'Balance de Ecuaciones',
    subtitle: 'La materia no se crea ni se destruye',
    concept:
      'En toda reacción química el número de átomos de cada elemento debe ser ' +
      'igual en reactivos y productos (Ley de conservación de la masa).',
    formula: 'a A  +  b B  →  c C  +  d D',
    formulaLabel: 'Átomos entrada = Átomos salida',
    example: '2 H₂  +  O₂  →  2 H₂O   (H: 4 = 4,  O: 2 = 2) ✓',
    tips: [
      'Nunca cambies los subíndices; solo ajusta los coeficientes',
      'Balancea primero los elementos menos frecuentes',
      'Verifica átomo por átomo al terminar',
    ],
  },
  stoichiometry: {
    title: 'Estequiometría',
    subtitle: 'Relaciones cuantitativas en reacciones',
    concept:
      'La estequiometría usa los coeficientes de una ecuación balanceada como ' +
      'factores de conversión para calcular reactivos o productos.',
    formula: 'mol A × (coef B / coef A) = mol B',
    formulaLabel: 'Factor estequiométrico',
    example: '2H₂ + O₂ → 2H₂O:  4 mol H₂ produce 4 mol H₂O',
    tips: [
      'Convierte siempre a moles antes de calcular',
      'Aplica el factor estequiométrico correcto',
      'Convierte el resultado a gramos con la masa molar si se pide',
    ],
  },
  limiting_reagent: {
    title: 'Reactivo Limitante',
    subtitle: 'El reactivo que se agota primero',
    concept:
      'El reactivo limitante (RL) determina la cantidad máxima de producto ' +
      'posible. Se identifica calculando cuál se consume antes.',
    formula: 'RL → menor valor de (mol disponible ÷ coeficiente)',
    formulaLabel: 'Comparar la relación mol/coeficiente',
    example: '3H₂ + N₂ → 2NH₃:  6 mol H₂ y 3 mol N₂ → RL = H₂ (6/3 = 2 < 3/1 = 3)',
    tips: [
      'Divide moles disponibles entre el coeficiente de cada reactivo',
      'El menor cociente indica el reactivo limitante',
      'El otro reactivo queda en exceso (sin reaccionar)',
    ],
  },
  yield: {
    title: 'Rendimiento de Reacción',
    subtitle: '¿Qué % del producto teórico se obtuvo?',
    concept:
      'El rendimiento porcentual compara la cantidad real de producto obtenido ' +
      'con la cantidad teórica máxima calculada estequiométricamente.',
    formula: '% Rendimiento = (Real ÷ Teórico) × 100',
    formulaLabel: 'Siempre ≤ 100 %',
    example: 'Teórico: 10 g  |  Real: 8.5 g  →  (8.5/10) × 100 = 85 %',
    tips: [
      'El teórico se calcula con estequiometría',
      'El real se mide experimentalmente',
      'Pérdidas por temperatura, pureza, etc. bajan el rendimiento',
    ],
  },
}

export const DEFAULT_THEORY: TopicTheory = THEORY.molar_mass
