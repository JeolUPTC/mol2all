import { RouterProvider } from 'react-router-dom'
import { Providers } from './providers'
import { router } from './router'
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary'
import { ReloadPrompt } from '@shared/components/ui/ReloadPrompt'

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
        <ReloadPrompt />
      </Providers>
    </ErrorBoundary>
  )
}
