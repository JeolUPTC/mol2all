import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ToastContainer } from '@shared/components/ui/ToastContainer'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
