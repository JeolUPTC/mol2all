import { Outlet } from 'react-router-dom'

export function GameLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      <Outlet />
    </div>
  )
}
