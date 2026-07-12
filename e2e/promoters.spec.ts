import { expect, test } from '@playwright/test'

import { expectLoginRedirect, hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

test.describe('Promoters @auth', () => {
  test('redirects unauthenticated visits to login', async ({ page }) => {
    await page.goto('/dashboard/promoters/new')
    await expectLoginRedirect(page)
  })

  test('portal login checkbox reveals grant fields on create form', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/promoters/new')

    await expect(page.getByRole('heading', { name: 'Add promoter' })).toBeVisible()

    const loginCheckbox = page.getByRole('checkbox', {
      name: 'Give this promoter portal login access',
    })

    await expect(loginCheckbox).not.toBeChecked()
    await expect(page.getByLabel('Login email')).toHaveCount(0)
    await expect(page.getByLabel('Temporary password')).toHaveCount(0)

    await loginCheckbox.click()
    await expect(loginCheckbox).toBeChecked()
    await expect(page.getByText('Grant login access')).toBeVisible()
    await expect(page.getByLabel('Login email')).toBeVisible()
    await expect(page.getByLabel('Temporary password')).toBeVisible()

    await loginCheckbox.click()
    await expect(loginCheckbox).not.toBeChecked()
    await expect(page.getByLabel('Login email')).toHaveCount(0)
    await expect(page.getByLabel('Temporary password')).toHaveCount(0)
  })
})
