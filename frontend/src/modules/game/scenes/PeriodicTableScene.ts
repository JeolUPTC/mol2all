import Phaser from 'phaser'

interface PTSceneData {
  onElementSelect?: (mass: number) => void
}

interface Element {
  sym: string
  name: string
  num: number
  mass: number
  col: number
  row: number
  type: string
}

const TYPE_COLORS: Record<string, number> = {
  nonmetal:       0x3b82f6,
  noble_gas:      0xec4899,
  alkali_metal:   0xef4444,
  alkaline_earth: 0xf97316,
  metalloid:      0x14b8a6,
  post_transition:0x22c55e,
  halogen:        0x8b5cf6,
  transition_metal:0x4b5563,
}

const TYPE_LABELS: Record<string, string> = {
  alkali_metal:    'Metal alcalino',
  alkaline_earth:  'Metal alcalinotérreo',
  transition_metal:'Metal de transición',
  post_transition: 'Metal post-transición',
  metalloid:       'Metaloide',
  nonmetal:        'No metal',
  halogen:         'Halógeno',
  noble_gas:       'Gas noble',
}

const ELEMENTS: Element[] = [
  // Period 1
  { sym:'H',  name:'Hidrógeno',  num:1,  mass:1.008,   col:1,  row:1, type:'nonmetal' },
  { sym:'He', name:'Helio',      num:2,  mass:4.003,   col:18, row:1, type:'noble_gas' },
  // Period 2
  { sym:'Li', name:'Litio',      num:3,  mass:6.941,   col:1,  row:2, type:'alkali_metal' },
  { sym:'Be', name:'Berilio',    num:4,  mass:9.012,   col:2,  row:2, type:'alkaline_earth' },
  { sym:'B',  name:'Boro',       num:5,  mass:10.811,  col:13, row:2, type:'metalloid' },
  { sym:'C',  name:'Carbono',    num:6,  mass:12.011,  col:14, row:2, type:'nonmetal' },
  { sym:'N',  name:'Nitrógeno',  num:7,  mass:14.007,  col:15, row:2, type:'nonmetal' },
  { sym:'O',  name:'Oxígeno',    num:8,  mass:15.999,  col:16, row:2, type:'nonmetal' },
  { sym:'F',  name:'Flúor',      num:9,  mass:18.998,  col:17, row:2, type:'halogen' },
  { sym:'Ne', name:'Neón',       num:10, mass:20.180,  col:18, row:2, type:'noble_gas' },
  // Period 3
  { sym:'Na', name:'Sodio',      num:11, mass:22.990,  col:1,  row:3, type:'alkali_metal' },
  { sym:'Mg', name:'Magnesio',   num:12, mass:24.305,  col:2,  row:3, type:'alkaline_earth' },
  { sym:'Al', name:'Aluminio',   num:13, mass:26.982,  col:13, row:3, type:'post_transition' },
  { sym:'Si', name:'Silicio',    num:14, mass:28.086,  col:14, row:3, type:'metalloid' },
  { sym:'P',  name:'Fósforo',    num:15, mass:30.974,  col:15, row:3, type:'nonmetal' },
  { sym:'S',  name:'Azufre',     num:16, mass:32.065,  col:16, row:3, type:'nonmetal' },
  { sym:'Cl', name:'Cloro',      num:17, mass:35.453,  col:17, row:3, type:'halogen' },
  { sym:'Ar', name:'Argón',      num:18, mass:39.948,  col:18, row:3, type:'noble_gas' },
  // Period 4
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
  // Period 5
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

const CELL_W = 38
const CELL_H = 52
const GAP    = 2

export class PeriodicTableScene extends Phaser.Scene {
  private infoText!: Phaser.GameObjects.Text
  private onElementSelect?: (mass: number) => void

  constructor() {
    super({ key: 'PeriodicTableScene' })
  }

  init(data: PTSceneData) {
    this.onElementSelect = data.onElementSelect

    const { width, height } = this.cameras.main
    const cx = width / 2
    const cy = height / 2

    const gridW = 18 * CELL_W + 17 * GAP  // 718
    const gridH = 5 * CELL_H + 4 * GAP    // 268
    const panelW = gridW + 32              // 750
    const panelH = gridH + 110             // header + info bar

    // Overlay
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.80)

    // Panel
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x0f172a)
    panel.setStrokeStyle(2, 0x38bdf8)

    // Header
    this.add.text(cx - panelW / 2 + 14, cy - panelH / 2 + 10, '⚛  Tabla Periódica', {
      fontFamily: 'Exo 2, system-ui',
      fontSize: '14px',
      color: '#38bdf8',
      fontStyle: 'bold',
    })

    const closeBtn = this.add
      .text(cx + panelW / 2 - 12, cy - panelH / 2 + 10, '✕', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '16px',
        color: '#64748b',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#f1f5f9' }))
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#64748b' }))
    closeBtn.on('pointerdown', () => this.scene.stop('PeriodicTableScene'))

    // Grid origin (top-left of first cell)
    const gridX0 = cx - gridW / 2
    const gridY0 = cy - panelH / 2 + 38

    // Info bar below grid
    const infoY = gridY0 + gridH + 14
    this.infoText = this.add
      .text(cx, infoY, 'Hover sobre un elemento para ver detalles  •  Click para usar su masa molar', {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '10px',
        color: '#475569',
        align: 'center',
      })
      .setOrigin(0.5, 0)

    // Draw elements
    ELEMENTS.forEach((el) => {
      const ex = gridX0 + (el.col - 1) * (CELL_W + GAP)
      const ey = gridY0 + (el.row - 1) * (CELL_H + GAP)
      const cx2 = ex + CELL_W / 2
      const cy2 = ey + CELL_H / 2
      const baseColor = TYPE_COLORS[el.type] ?? 0x334155
      const darkColor  = Phaser.Display.Color.ValueToColor(baseColor).darken(55).color

      const bg = this.add
        .rectangle(cx2, cy2, CELL_W, CELL_H, darkColor)
        .setStrokeStyle(1, baseColor)
        .setInteractive({ useHandCursor: true })

      // atomic number
      this.add.text(ex + 2, ey + 2, String(el.num), {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '7px',
        color: '#94a3b8',
      })

      // symbol
      this.add.text(cx2, cy2 - 4, el.sym, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: el.sym.length > 2 ? '11px' : '14px',
        color: '#f1f5f9',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5)

      // atomic mass
      this.add.text(cx2, ey + CELL_H - 10, el.mass.toFixed(el.mass < 10 ? 3 : el.mass < 100 ? 2 : 1), {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '7px',
        color: '#64748b',
      }).setOrigin(0.5, 0)

      bg.on('pointerover', () => {
        bg.setFillStyle(baseColor)
        this.infoText.setText(
          `${el.name}  (${el.sym})  —  Masa atómica: ${el.mass} g/mol  —  ${TYPE_LABELS[el.type] ?? el.type}`,
        )
        this.infoText.setStyle({ color: '#e2e8f0' })
      })
      bg.on('pointerout', () => {
        bg.setFillStyle(darkColor)
        this.infoText.setText('Hover sobre un elemento para ver detalles  •  Click para usar su masa molar')
        this.infoText.setStyle({ color: '#475569' })
      })
      bg.on('pointerdown', () => {
        if (this.onElementSelect) {
          this.onElementSelect(el.mass)
        }
      })
    })

    // Legend
    const legendY = infoY + 26
    const legendTypes = ['alkali_metal', 'alkaline_earth', 'transition_metal', 'post_transition', 'metalloid', 'nonmetal', 'halogen', 'noble_gas']
    const legendSpacing = panelW / legendTypes.length
    legendTypes.forEach((type, i) => {
      const lx = cx - panelW / 2 + legendSpacing * i + legendSpacing / 2
      const color = TYPE_COLORS[type]
      this.add.rectangle(lx - 18, legendY + 4, 10, 10, color)
      this.add.text(lx - 12, legendY, TYPE_LABELS[type].split(' ')[0], {
        fontFamily: 'Exo 2, system-ui',
        fontSize: '8px',
        color: '#64748b',
      })
    })
  }
}
