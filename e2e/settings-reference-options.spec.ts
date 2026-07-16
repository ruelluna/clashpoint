import { expect, test } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

test.describe('Settings reference options @auth', () => {
  test('admin can add breed and color catalog options', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = Date.now().toString(36)
    const breedName = `E2E Breed ${suffix}`
    const colorName = `E2E Color ${suffix}`

    await signInAsAdmin(page)
    await page.goto('/dashboard/settings')

    const breedSection = page.getByTestId('settings-breed-options')
    await breedSection.locator('input').fill(breedName)
    await breedSection.getByRole('button', { name: 'Add' }).click()
    await expect(breedSection.getByText(breedName)).toBeVisible({ timeout: 10_000 })

    const colorSection = page.getByTestId('settings-color-options')
    await colorSection.locator('input').fill(colorName)
    await colorSection.getByRole('button', { name: 'Add' }).click()
    await expect(colorSection.getByText(colorName)).toBeVisible({ timeout: 10_000 })

    await expect(page.getByTestId('settings-allow-public-breed-add')).toBeVisible()
    await expect(page.getByTestId('settings-allow-public-color-add')).toBeVisible()
  })
})
