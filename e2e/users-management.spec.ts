import { expect, test } from '@playwright/test'

import { expectLoginRedirect, hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

test.describe('Users management @auth', () => {
  test('redirects unauthenticated visits to login', async ({ page }) => {
    await page.goto('/dashboard/users')
    await expectLoginRedirect(page)
  })

  test('shows users page for signed-in admin', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/users')

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await expect(
      page.getByText('Manage staff and organizer accounts, roles, and module access.')
    ).toBeVisible()
    await expect(
      page.getByText('External promoters are created under Promoters, not here.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Invite' })).toBeVisible()

    const roleSelect = page.locator('form').filter({ has: page.getByPlaceholder('Email') }).getByRole('combobox')
    await expect(roleSelect.locator('option', { hasText: 'Promoter' })).toHaveCount(0)
  })
})
