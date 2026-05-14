import { test, expect } from '@playwright/test'

// These tests run WITHOUT saved auth state (public pages)

test.describe('Página de login', () => {
  test('muestra formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  test('redirige al login cuando no está autenticado', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/auth/login')
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('estudiante@escuela.edu').fill('noexiste@test.com')
    await page.getByPlaceholder('••••••••').fill('contraseñamala')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page.getByText('Credenciales inválidas')).toBeVisible({ timeout: 5_000 })
  })

  test('login exitoso como estudiante lleva al dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('estudiante@escuela.edu').fill('estudiante@mol2all.com')
    await page.getByPlaceholder('••••••••').fill('student1234')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  })

  test('muestra link de olvido de contraseña', async ({ page }) => {
    await page.goto('/auth/login')
    const link = page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL('/auth/forgot-password')
  })
})

test.describe('Página de olvido de contraseña', () => {
  test('muestra el formulario', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByRole('heading', { name: '¿Olvidaste tu contraseña?' })).toBeVisible()
  })

  test('muestra confirmación al enviar el formulario', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await page.getByPlaceholder('estudiante@escuela.edu').fill('cualquiercorreo@test.com')
    await page.getByRole('button', { name: 'Enviar enlace' }).click()
    await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible({
      timeout: 5_000,
    })
  })
})
