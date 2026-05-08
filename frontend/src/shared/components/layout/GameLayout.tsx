import { Outlet } from 'react-router-dom'

export function GameLayout() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black">
      <Outlet />
    </div>
  )
}
