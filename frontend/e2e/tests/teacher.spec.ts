import { test, expect } from '@playwright/test'
import { TEACHER_STATE, STUDENT_STATE } from '../auth.setup'

test.describe('Panel docente — acceso como docente', () => {
  test.use({ storageState: TEACHER_STATE })

  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher')
    await expect(page).toHaveURL('/teacher', { timeout: 10_000 })
  })

  test('muestra el título del panel docente', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Panel Docente' })).toBeVisible()
  })

  test('muestra la tabla de estudiantes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible()
  })

  test('muestra las tarjetas de resumen', async ({ page }) => {
    await expect(page.getByText('Estudiantes activos')).toBeVisible()
    await expect(page.getByText('Sesiones completadas')).toBeVisible()
  })

  test('muestra el botón de descargar CSV', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Descargar CSV' })).toBeVisible()
  })
})

test.describe('Panel docente — acceso denegado a estudiante', () => {
  test.use({ storageState: STUDENT_STATE })

  test('estudiante no puede acceder al panel docente', async ({ page }) => {
    await page.goto('/teacher')
    // Should be redirected or show access denied (RoleGuard redirects to /dashboard)
    await expect(page).not.toHaveURL('/teacher', { timeout: 5_000 })
  })
})
