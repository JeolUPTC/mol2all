import { useState } from 'react'
import { GroupsTab } from './tabs/GroupsTab'
import { StatsTab }  from './tabs/StatsTab'
import { BankTab }   from './tabs/BankTab'

type Tab = 'groups' | 'stats' | 'bank'

export function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>('groups')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Panel Docente</h1>

      <div className="flex gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {([
          ['groups', 'Mis Grupos'],
          ['stats',  'Estadísticas'],
          ['bank',   'Banco de Preguntas'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'groups' && <GroupsTab />}
      {tab === 'stats'  && <StatsTab />}
      {tab === 'bank'   && <BankTab />}
    </div>
  )
}
