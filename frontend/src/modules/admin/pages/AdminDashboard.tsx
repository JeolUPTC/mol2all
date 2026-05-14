import { useEffect, useState } from 'react'
import { adminService } from '../services/admin.service'
import { StatsTab }  from './tabs/StatsTab'
import { UsersTab }  from './tabs/UsersTab'
import { GroupsTab } from './tabs/GroupsTab'
import { LevelsTab } from './tabs/LevelsTab'
import { ReviewTab } from './tabs/ReviewTab'
import { BankTab }   from './tabs/BankTab'
import { SystemTab } from './tabs/SystemTab'

type Tab = 'stats' | 'users' | 'groups' | 'levels' | 'review' | 'bank' | 'system'

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('stats')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    adminService.getPendingQuestions()
      .then((qs) => setPendingCount(qs.filter((q) => q.status === 'PENDING').length))
      .catch(() => {})
  }, [])

  const tabs: [Tab, string][] = [
    ['stats',  'Resumen'],
    ['users',  'Usuarios'],
    ['groups', 'Grupos'],
    ['levels', 'Niveles'],
    ['review', pendingCount > 0 ? `Revisión (${pendingCount})` : 'Revisión'],
    ['bank',   'Banco'],
    ['system', 'Sistema'],
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-100">Administración</h1>

      <div className="flex flex-wrap gap-1 rounded-xl border border-game-border bg-game-surface p-1">
        {tabs.map(([t, lbl]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-brand-600 text-white'
                : t === 'review' && pendingCount > 0
                ? 'text-amber-400 hover:text-amber-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'stats'  && <StatsTab />}
      {tab === 'users'  && <UsersTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'levels' && <LevelsTab />}
      {tab === 'review' && <ReviewTab onCountChange={setPendingCount} />}
      {tab === 'bank'   && <BankTab />}
      {tab === 'system' && <SystemTab />}
    </div>
  )
}
