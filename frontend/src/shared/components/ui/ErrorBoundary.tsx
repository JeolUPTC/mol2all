import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', _error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-center">
          <p className="text-5xl">⚗️</p>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-100">Algo salió mal</h1>
            <p className="mt-2 text-sm text-slate-400">
              Ocurrió un error inesperado. Recarga la página para continuar.
            </p>
            {this.state.message && (
              <p className="mt-2 rounded bg-slate-800 px-3 py-1 font-mono text-xs text-red-400">
                {this.state.message}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.replace('/dashboard')}
            className="btn-primary"
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
