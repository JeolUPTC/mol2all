const SUBS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}

const SUPS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}

function toSub(s: string): string { return [...s].map(d => SUBS[d] ?? d).join('') }
function toSup(s: string): string { return [...s].map(c => SUPS[c] ?? c).join('') }

/**
 * Converts ASCII chemical notation to Unicode sub/superscripts for Phaser text.
 *
 * Rules (applied in order):
 *  1.  ->  →  →  ;  <->  →  ⇌
 *  2.  Charge with subscript prefix: element + subscript_digits + charge_digit + sign
 *        SO42-  →  SO₄²⁻    Fe2+  →  Fe²⁺    Ca2+  →  Ca²⁺
 *      The LAST digit before the sign is the charge multiplier; any preceding
 *      digits (after the element letter) are subscripts.
 *  3.  Lone sign (no digit): Cl-  →  Cl⁻   Na+  →  Na⁺   OH-  →  OH⁻
 *  4.  Subscripts: remaining digits after element symbol or closing paren
 *        H2O  →  H₂O    C6H12O6  →  C₆H₁₂O₆    Ca(OH)2  →  Ca(OH)₂
 *
 * Known limitation: polyatomic ions where the last digit is a subscript and the
 * charge is a lone sign (e.g. NH4+, MnO4-) render as NH⁴⁺ / MnO⁴⁻ instead of
 * NH₄⁺ / MnO₄⁻. For high-school stoichiometry topics this edge case is rare.
 */
export function chemFormat(text: string): string {
  let s = text
    .replace(/<->/g, '⇌')
    .replace(/->/g, '→')

  // Step 2 — charge with optional subscript prefix
  // Captures: pre-letter, zero-or-more subscript digits, exactly one charge digit, sign
  // Lookahead ensures the sign ends the formula token (space, punct, arrow, end-of-string)
  s = s.replace(
    /([A-Za-z)])(\d*)(\d)([+-])(?=[\s,.)\]→⇌;:!?]|$)/g,
    (_, pre, subPart, chargeDig, sign) => pre + toSub(subPart) + toSup(chargeDig + sign),
  )

  // Step 3 — lone sign (no digit before it)
  s = s.replace(
    /([A-Za-z₀-₉)])([+-])(?=[\s,.)\]→⇌;:!?]|$)/g,
    (_, pre, sign) => pre + toSup(sign),
  )

  // Step 4 — subscripts: digits immediately after element symbol or closing paren
  s = s.replace(/([A-Z][a-z]?|\))(\d+)/g, (_, pre, digits) => pre + toSub(digits))

  return s
}
