import { test, expect } from '@playwright/test'

// These tests run WITHOUT auth state

test.describe('Página 404', () => {
  test('muestra el código 404 en ruta inexistente', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe')
    await expect(page.getByText('404')).toBeVisible()
  })

  test('muestra el mensaje de página no encontrada', async ({ page }) => {
    await page.goto('/otra/ruta/inexistente')
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
  })

  test('el botón volver al inicio es visible', async ({ page }) => {
    await page.goto('/no-existe')
    await expect(page.getByRole('button', { name: 'Volver al inicio' })).toBeVisible()
  })
})
