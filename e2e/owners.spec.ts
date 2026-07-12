import { expect, test } from '@playwright/test'

import { expectLoginRedirect, hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

test.describe('Owners management @auth', () => {
  test('redirects unauthenticated visits to login', async ({ page }) => {
    await page.goto('/dashboard/owners')
    await expectLoginRedirect(page)
  })

  test('shows owners page and creates a saved owner', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)

    await expect(page.getByRole('link', { name: 'Owners' })).toBeVisible()

    await page.goto('/dashboard/owners')

    await expect(
      page.getByRole('heading', { name: 'Owners & game farms' })
    ).toBeVisible()
    await expect(
      page.getByText('Manage saved owner names and game farms used when encoding rooster entries.')
    ).toBeVisible()

    const ownerName = `E2E Farm ${Date.now()}`

    await page.getByRole('link', { name: 'Add owner' }).click()
    await expect(page.getByRole('heading', { name: 'Add owner' })).toBeVisible()

    await page.getByLabel('Owner name / game farm').fill(ownerName)
    await page.getByRole('button', { name: 'Save owner' }).click()

    await expect(page.getByRole('heading', { name: ownerName })).toBeVisible()

    await page.goto('/dashboard/owners')
    await expect(page.getByText(ownerName)).toBeVisible()
  })
})
