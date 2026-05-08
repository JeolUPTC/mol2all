import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-center">
      <p className="font-display text-8xl font-bold text-slate-700">404</p>
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-100">Página no encontrada</h1>
        <p className="mt-2 text-slate-400">Esta ruta no existe o fue movida.</p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-primary"
      >
        Volver al inicio
      </button>
    </div>
  )
}
