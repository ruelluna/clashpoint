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
      page.getByText('Manage staff accounts, roles, and module access.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible()

    await page.getByTestId('users-add-toggle').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Add user' })).toBeVisible()
    await expect(page.getByTestId('users-invite-button')).toBeVisible()

    const roleSelect = page.getByRole('dialog').getByRole('combobox')
    await expect(roleSelect.locator('option', { hasText: 'Promoter' })).toHaveCount(0)
  })

  test('shows module access only in edit mode for staff rows', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/users')

    const editButton = page.getByRole('button', { name: 'Edit' }).first()
    const editVisible = await editButton.isVisible().catch(() => false)
    test.skip(!editVisible, 'No active users with edit actions in test data')

    await expect(page.getByLabel('Promoters')).toHaveCount(0)

    await editButton.click()
    await expect(page.getByLabel('Promoters')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByLabel('Promoters')).toHaveCount(0)
  })
})
