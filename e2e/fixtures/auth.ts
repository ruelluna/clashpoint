import { expect, type Page } from '@playwright/test'

export const adminCredentials = {
  email: process.env.PLAYWRIGHT_ADMIN_EMAIL ?? '',
  password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? '',
}

export function hasAdminCredentials() {
  return Boolean(adminCredentials.email && adminCredentials.password)
}

export async function gotoLoginPage(page: Page) {
  await page.goto('/login')
  await expect(
    page.getByRole('button', { name: /Sign in|Create admin account/ })
  ).toBeVisible({ timeout: 15_000 })
}

export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string
) {
  await gotoLoginPage(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

export async function signInAsAdmin(page: Page) {
  await signInWithCredentials(
    page,
    adminCredentials.email,
    adminCredentials.password
  )

  try {
    await expect(page).toHaveURL(/\/dashboard(\?|$)/, { timeout: 15_000 })
  } catch {
    const formError = page.locator('form [role="alert"]')
    if (await formError.isVisible()) {
      throw new Error(await formError.innerText())
    }

    throw new Error(`Sign-in did not reach dashboard (current URL: ${page.url()})`)
  }
}

export async function expectLoginRedirect(page: Page) {
  await expect(page).toHaveURL(/\/login(\?|$)/)
}
