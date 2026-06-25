import type { Page } from '@playwright/test'

export const adminCredentials = {
  email: process.env.PLAYWRIGHT_ADMIN_EMAIL ?? '',
  password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? '',
}

export function hasAdminCredentials() {
  return Boolean(adminCredentials.email && adminCredentials.password)
}

export async function signInAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(adminCredentials.email)
  await page.getByLabel('Password').fill(adminCredentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}
