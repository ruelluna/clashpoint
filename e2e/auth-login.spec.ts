import { expect, test } from '@playwright/test'

import {
  adminCredentials,
  hasAdminCredentials,
  signInAsAdmin,
} from './fixtures/auth'

test.describe('Auth login @auth', () => {
  test('redirects unauthenticated dashboard visits to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await page.goto('/login')
    await page.getByLabel('Email').fill(adminCredentials.email)
    await page.getByLabel('Password').fill('wrong-password-value')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('signs in as admin and reaches dashboard', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)

    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
    await expect(page.getByText('Signed in as admin')).toBeVisible()
  })
})
