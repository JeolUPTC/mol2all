export const TOPIC_LABELS: Record<string, string> = {
  molar_mass: 'Masa Molar', balancing: 'Balanceo',
  stoichiometry: 'Estequiometría', limiting_reagent: 'Reactivo Límite',
  yield: 'Rendimiento', mixed: 'Mixto',
}
export const STATUS_LABELS = {
  PENDING:  { label: 'Pendiente', cls: 'bg-amber-900/50 text-amber-300' },
  APPROVED: { label: 'Aprobada',  cls: 'bg-emerald-900/50 text-emerald-300' },
  REJECTED: { label: 'Rechazada', cls: 'bg-red-900/50 text-red-400' },
}
export const TYPE_SHORT: Record<string, string> = {
  MULTIPLE_CHOICE:  'Opción múltiple',
  NUMERIC_INPUT:    'Numérica',
  EQUATION_BALANCE: 'Ecuación',
}

export function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-game-surface" />
      ))}
    </div>
  )
}
