export interface DonutSlice {
  label: string
  value: number
  color: string
}

export function DonutChart({ slices, size = 140 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">Sin datos disponibles</p>
  }

  const r = 36
  const circumference = 2 * Math.PI * r
  let acc = 0
  const segments = slices.map((s) => {
    const dash = (s.value / total) * circumference
    const seg = { ...s, dash, offset: acc }
    acc += dash
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="22"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="w-full space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: seg.color }} />
            <span className="flex-1 text-slate-300">{seg.label}</span>
            <span className="font-semibold tabular-nums text-white">{seg.value}</span>
            <span className="w-10 text-right text-slate-500">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface HBarItem {
  label: string
  value: number
  suffix?: string
  color?: string
}

export function HBarList({
  items,
  max: maxProp,
  suffix = '',
}: {
  items: HBarItem[]
  max?: number
  suffix?: string
}) {
  const max = maxProp ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-right text-xs text-slate-300">
            {item.label}
          </span>
          <div className="flex-1 overflow-hidden rounded-full bg-slate-700" style={{ height: 10 }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${max > 0 ? Math.round((item.value / max) * 100) : 0}%`,
                background: item.color ?? '#6366f1',
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-300">
            {item.value}
            {item.suffix ?? suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export interface VBarItem {
  label: string
  value: number
  color?: string
}

export function VBarChart({ items, height = 120 }: { items: VBarItem[]; height?: number }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {items.map((item, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-medium tabular-nums text-slate-300">
              {item.value > 0 ? item.value : ''}
            </span>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? 2 : 0,
                background: item.color ?? '#6366f1',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex-1 truncate text-center text-xs leading-tight text-slate-400"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
