export interface Element {
  symbol: string
  name: string
  mass: number   // g/mol, standard atomic weight
}

export const ELEMENTS: Record<string, Element> = {
  H:  { symbol: 'H',  name: 'Hidrógeno',   mass: 1.008   },
  He: { symbol: 'He', name: 'Helio',        mass: 4.003   },
  Li: { symbol: 'Li', name: 'Litio',        mass: 6.941   },
  Be: { symbol: 'Be', name: 'Berilio',      mass: 9.012   },
  B:  { symbol: 'B',  name: 'Boro',         mass: 10.81   },
  C:  { symbol: 'C',  name: 'Carbono',      mass: 12.011  },
  N:  { symbol: 'N',  name: 'Nitrógeno',    mass: 14.007  },
  O:  { symbol: 'O',  name: 'Oxígeno',      mass: 15.999  },
  F:  { symbol: 'F',  name: 'Flúor',        mass: 18.998  },
  Ne: { symbol: 'Ne', name: 'Neón',         mass: 20.180  },
  Na: { symbol: 'Na', name: 'Sodio',        mass: 22.990  },
  Mg: { symbol: 'Mg', name: 'Magnesio',     mass: 24.305  },
  Al: { symbol: 'Al', name: 'Aluminio',     mass: 26.982  },
  Si: { symbol: 'Si', name: 'Silicio',      mass: 28.086  },
  P:  { symbol: 'P',  name: 'Fósforo',      mass: 30.974  },
  S:  { symbol: 'S',  name: 'Azufre',       mass: 32.06   },
  Cl: { symbol: 'Cl', name: 'Cloro',        mass: 35.45   },
  Ar: { symbol: 'Ar', name: 'Argón',        mass: 39.948  },
  K:  { symbol: 'K',  name: 'Potasio',      mass: 39.098  },
  Ca: { symbol: 'Ca', name: 'Calcio',       mass: 40.078  },
  Cr: { symbol: 'Cr', name: 'Cromo',        mass: 51.996  },
  Mn: { symbol: 'Mn', name: 'Manganeso',    mass: 54.938  },
  Fe: { symbol: 'Fe', name: 'Hierro',       mass: 55.845  },
  Co: { symbol: 'Co', name: 'Cobalto',      mass: 58.933  },
  Ni: { symbol: 'Ni', name: 'Níquel',       mass: 58.693  },
  Cu: { symbol: 'Cu', name: 'Cobre',        mass: 63.546  },
  Zn: { symbol: 'Zn', name: 'Zinc',         mass: 65.38   },
  Br: { symbol: 'Br', name: 'Bromo',        mass: 79.904  },
  Kr: { symbol: 'Kr', name: 'Kriptón',      mass: 83.798  },
  Ag: { symbol: 'Ag', name: 'Plata',        mass: 107.868 },
  I:  { symbol: 'I',  name: 'Yodo',         mass: 126.904 },
  Ba: { symbol: 'Ba', name: 'Bario',        mass: 137.327 },
  Hg: { symbol: 'Hg', name: 'Mercurio',     mass: 200.59  },
  Pb: { symbol: 'Pb', name: 'Plomo',        mass: 207.2   },
}

export function getElement(symbol: string): Element {
  const el = ELEMENTS[symbol]
  if (!el) throw new Error(`Elemento desconocido: ${symbol}`)
  return el
}
