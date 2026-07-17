import { expect, test } from '@playwright/test'

import {
  hasAdminCredentials,
  signInAsAdmin,
} from './fixtures/auth'

test.describe('Mobile dashboard shell @auth', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  })

  test('opens drawer, navigates to Events, and closes drawer', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)

    await page.getByRole('button', { name: 'Toggle sidebar' }).click()
    await expect(page.getByText('Navigation')).toBeVisible()

    await page.getByRole('link', { name: 'Events' }).click()
    await expect(page).toHaveURL(/\/dashboard\/events(\?|$)/)
    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
    await expect(page.getByText('Navigation')).not.toBeVisible()
  })
})
