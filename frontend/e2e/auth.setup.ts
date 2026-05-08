import { test as setup, expect } from '@playwright/test'
import path from 'path'

// Credential constants — must match prisma/seed.ts
const STUDENT = { email: 'estudiante@mol2all.com', password: 'student1234' }
const TEACHER = { email: 'docente@mol2all.com', password: 'teacher1234' }
const ADMIN = { email: 'admin@mol2all.com', password: 'admin1234' }

export const STUDENT_STATE = path.join('e2e', '.auth', 'student.json')
export const TEACHER_STATE = path.join('e2e', '.auth', 'teacher.json')
export const ADMIN_STATE = path.join('e2e', '.auth', 'admin.json')

async function loginAndSave(
  page: Parameters<Parameters<typeof setup>[1]>[0],
  email: string,
  password: string,
  statePath: string,
) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('estudiante@escuela.edu').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  await page.context().storageState({ path: statePath })
}

setup('save student auth state', async ({ page }) => {
  await loginAndSave(page, STUDENT.email, STUDENT.password, STUDENT_STATE)
})

setup('save teacher auth state', async ({ page }) => {
  await loginAndSave(page, TEACHER.email, TEACHER.password, TEACHER_STATE)
})

setup('save admin auth state', async ({ page }) => {
  await loginAndSave(page, ADMIN.email, ADMIN.password, ADMIN_STATE)
})
