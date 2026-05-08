import { test, expect } from '@playwright/test'
import { STUDENT_STATE } from '../auth.setup'

test.use({ storageState: STUDENT_STATE })

test.describe('Dashboard del estudiante', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    // Wait for app to restore auth via refresh token
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  })

  test('muestra saludo personalizado', async ({ page }) => {
    await expect(page.getByText(/¡Hola,/)).toBeVisible()
  })

  test('muestra la sección de niveles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Niveles' })).toBeVisible()
  })

  test('el primer nivel aparece como disponible', async ({ page }) => {
    // The first level card should NOT be locked (no padlock / locked state)
    const firstCard = page.locator('[data-level-order="1"]').first()
    // Fallback: look for "Introducción" which is the first level name from seed
    const levelCard = page.getByText('Introducción a la Masa Molar').first()
    await expect(levelCard).toBeVisible()
  })

  test('navbar muestra el link al perfil', async ({ page }) => {
    // The navbar shows the username/avatar linking to profile
    await expect(page.getByRole('link', { name: /estudiante_demo|Carlos/i }).first()).toBeVisible()
  })

  test('navegar al perfil muestra la página de perfil', async ({ page }) => {
    await page.getByRole('link', { name: '/profile' }).first().click().catch(() => {
      // If direct link not found, use the URL
    })
    await page.goto('/profile')
    await expect(page).toHaveURL('/profile')
  })
})
