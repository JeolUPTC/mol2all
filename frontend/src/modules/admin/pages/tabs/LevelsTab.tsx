import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import type { AdminLevel } from '../../services/admin.service'
import { TOPIC_LABELS, LoadingSkeleton } from './shared'

export function LevelsTab() {
  const [levels, setLevels]    = useState<AdminLevel[]>([])
  const [loading, setLoading]  = useState(true)
  const [editing, setEditing]  = useState<{
    id: string; field: 'xpReward' | 'coinsReward'; value: string
  } | null>(null)

  useEffect(() => {
    adminService.getLevels().then(setLevels).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleActive = async (level: AdminLevel) => {
    try {
      const updated = await adminService.updateLevel(level.id, { isActive: !level.isActive })
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
    } catch { /* silencioso */ }
  }

  const saveEdit = async () => {
    if (!editing) return
    const num = parseInt(editing.value, 10)
    if (isNaN(num) || num < 0) { setEditing(null); return }
    try {
      const updated = await adminService.updateLevel(editing.id, { [editing.field]: num })
      setLevels((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)))
    } catch { /* silencioso */ }
    finally { setEditing(null) }
  }

  const renderEditable = (level: AdminLevel, field: 'xpReward' | 'coinsReward') => {
    const isEditingThis = editing?.id === level.id && editing.field === field
    if (isEditingThis) {
      return (
        <input
          type="number" min={0} autoFocus value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onBlur={saveEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null) }}
          className="w-20 rounded border border-brand-500 bg-slate-700 px-2 py-0.5 text-right tabular-nums text-slate-100 focus:outline-none"
        />
      )
    }
    return (
      <button
        onClick={() => setEditing({ id: level.id, field, value: String(level[field]) })}
        title="Clic para editar"
        className="tabular-nums text-slate-200 underline decoration-dotted hover:text-white"
      >
        {level[field]}
      </button>
    )
  }

  if (loading) return <LoadingSkeleton rows={5} />

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-game-border text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tema</th>
              <th className="px-4 py-2 text-right">XP</th>
              <th className="px-4 py-2 text-right">Monedas</th>
              <th className="px-4 py-2 text-right">Completados</th>
              <th className="px-4 py-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.id} className="border-b border-game-border/50 hover:bg-slate-800/30">
                <td className="px-4 py-2 text-slate-500">{l.order}</td>
                <td className="px-4 py-2 font-medium text-slate-200">{l.name}</td>
                <td className="px-4 py-2 text-slate-400">{TOPIC_LABELS[l.topic] ?? l.topic}</td>
                <td className="px-4 py-2 text-right text-game-xp">{renderEditable(l, 'xpReward')}</td>
                <td className="px-4 py-2 text-right text-game-coins">{renderEditable(l, 'coinsReward')}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-400">{l._count.progress}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleActive(l)}
                    className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all ${
                      l.isActive
                        ? 'bg-emerald-900/60 text-emerald-400 hover:bg-red-900/60 hover:text-red-400'
                        : 'bg-red-900/60 text-red-400 hover:bg-emerald-900/60 hover:text-emerald-400'
                    }`}
                  >
                    {l.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
