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
      page.getByText('Manage staff accounts and roles.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Invite user' })).toBeVisible()
  })
})
