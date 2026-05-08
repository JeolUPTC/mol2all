/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from '@core/auth/AuthGuard'
import { RoleGuard } from '@core/auth/RoleGuard'
import { useAuthStore } from '@stores/authStore'
import { AppLayout } from '@shared/components/layout/AppLayout'
import { GameLayout } from '@shared/components/layout/GameLayout'
import { LoginPage } from '@modules/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@modules/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@modules/auth/pages/ResetPasswordPage'
import { StudentDashboard } from '@modules/dashboard/pages/StudentDashboard'
import { GamePage } from '@modules/game/pages/GamePage'
import { TeacherDashboard } from '@modules/teacher/pages/TeacherDashboard'
import { ProfilePage } from '@modules/profile/pages/ProfilePage'
import { NotFoundPage } from '@shared/components/ui/NotFoundPage'
import { AdminDashboard } from '@modules/admin/pages/AdminDashboard'
import { AnalyticsDashboard } from '@modules/analytics/pages/AnalyticsDashboard'

function RoleBasedRedirect() {
  const user = useAuthStore((s) => s.user)
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'TEACHER') return <Navigate to="/teacher" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <RoleBasedRedirect /> },
      {
        path: 'dashboard',
        element: (
          <RoleGuard allowedRoles={['STUDENT']} redirectTo="/">
            <StudentDashboard />
          </RoleGuard>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'teacher',
        element: (
          <RoleGuard allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <AnalyticsDashboard />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '/game/:levelId',
    element: (
      <AuthGuard>
        <GameLayout />
      </AuthGuard>
    ),
    children: [{ index: true, element: <GamePage /> }],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
