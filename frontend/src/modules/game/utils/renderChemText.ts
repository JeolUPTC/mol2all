import Phaser from 'phaser'

type SegType = 'normal' | 'sub' | 'sup'
interface ChemSeg { text: string; type: SegType }

const IS_SUB = (c: string): boolean => c >= '₀' && c <= '₉'
const IS_SUP = (c: string): boolean =>
  (c >= '⁰' && c <= '⁹') || c === '⁺' || c === '⁻'

const SUB_TO: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4',
  '₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
}
const SUP_TO: Record<string, string> = {
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4',
  '⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁺':'+','⁻':'-',
}

function chemSegments(text: string): ChemSeg[] {
  const segs: ChemSeg[] = []
  let buf = ''
  let cur: SegType = 'normal'
  for (const ch of text) {
    const t: SegType = IS_SUB(ch) ? 'sub' : IS_SUP(ch) ? 'sup' : 'normal'
    if (t === cur) {
      buf += ch
    } else {
      if (buf) segs.push({ text: buf, type: cur })
      buf = ch
      cur = t
    }
  }
  if (buf) segs.push({ text: buf, type: cur })
  return segs
}

function segToAscii(seg: ChemSeg): string {
  const map = seg.type === 'sub' ? SUB_TO : SUP_TO
  return [...seg.text].map(c => map[c] ?? c).join('')
}

function measureWord(
  scene: Phaser.Scene,
  word: string,
  fontSize: number,
  fontFamily: string,
  bold: boolean,
): number {
  let total = 0
  for (const seg of chemSegments(word)) {
    const size  = seg.type === 'normal' ? fontSize : Math.round(fontSize * 0.65)
    const label = seg.type === 'normal' ? seg.text : segToAscii(seg)
    const t = scene.add.text(0, 0, label, {
      fontFamily,
      fontSize: `${size}px`,
      fontStyle: bold ? 'bold' : 'normal',
    })
    total += t.width
    t.destroy()
  }
  return total
}

/**
 * Renders a single chemistry line with proper sub/superscript sizing.
 * Subscripts/superscripts are separate Text objects at 65% size with vertical offset.
 */
export function renderChemLine(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  text: string,
  fontSize: number,
  color: string,
  fontFamily = 'JetBrains Mono, monospace',
  bold = false,
): void {
  const segs = chemSegments(text)
  const hasScript = segs.some(s => s.type !== 'normal')

  if (!hasScript) {
    scene.add
      .text(cx, cy, text, {
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
        fontStyle: bold ? 'bold' : 'normal',
      })
      .setOrigin(0.5)
    return
  }

  const SUB_SIZE = Math.round(fontSize * 0.65)
  const SUP_SIZE = Math.round(fontSize * 0.65)
  const SUB_Y   = Math.round(fontSize * 0.26)
  const SUP_Y   = -Math.round(fontSize * 0.30)

  const parts: Array<{ obj: Phaser.GameObjects.Text }> = []

  for (const seg of segs) {
    const isNormal = seg.type === 'normal'
    const size  = isNormal ? fontSize : seg.type === 'sub' ? SUB_SIZE : SUP_SIZE
    const dy    = isNormal ? 0        : seg.type === 'sub' ? SUB_Y    : SUP_Y
    const label = isNormal ? seg.text : segToAscii(seg)

    const obj = scene.add
      .text(0, cy + dy, label, {
        fontFamily,
        fontSize: `${size}px`,
        color,
        fontStyle: bold ? 'bold' : 'normal',
      })
      .setOrigin(0, 0.5)

    parts.push({ obj })
  }

  const totalW = parts.reduce((s, p) => s + p.obj.width, 0)
  let x = cx - totalW / 2
  for (const { obj } of parts) {
    obj.setX(x)
    x += obj.width
  }
}

/**
 * Renders multi-line chemistry text centered at cx, starting at topY.
 * Splits on \n first (explicit paragraph breaks), then word-wraps each paragraph.
 * A blank paragraph adds 0.6 × lineH of vertical spacing.
 * Returns the total pixel height of the rendered block.
 */
export function renderChemWrapped(
  scene: Phaser.Scene,
  cx: number,
  topY: number,
  text: string,
  fontSize: number,
  color: string,
  maxWidth: number,
  fontFamily = 'Exo 2, system-ui',
  bold = false,
  lineSpacing = 10,
  measureOnly = false,
): number {
  const lineH = fontSize + lineSpacing
  const spaceW = measureWord(scene, ' ', fontSize, fontFamily, bold)
  const paragraphs = text.split('\n')
  let totalHeight = 0

  for (const para of paragraphs) {
    if (para.trim() === '') {
      totalHeight += lineH * 0.6
      continue
    }

    const words = para.split(' ').filter(w => w.length > 0)
    const widths = words.map(w => measureWord(scene, w, fontSize, fontFamily, bold))

    const lines: string[] = []
    let curWords: string[] = []
    let curW = 0

    words.forEach((word, i) => {
      const ww = widths[i]
      const needed = curWords.length === 0 ? ww : curW + spaceW + ww
      if (curWords.length > 0 && needed > maxWidth) {
        lines.push(curWords.join(' '))
        curWords = [word]
        curW = ww
      } else {
        curWords.push(word)
        curW = needed
      }
    })
    if (curWords.length) lines.push(curWords.join(' '))

    lines.forEach((line, li) => {
      const lineY = Math.round(topY + totalHeight + li * lineH + fontSize / 2)
      if (!measureOnly) renderChemLine(scene, cx, lineY, line, fontSize, color, fontFamily, bold)
    })
    totalHeight += lines.length * lineH
  }

  return totalHeight
}
