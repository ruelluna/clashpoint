import { expect, test } from '@playwright/test'

test.describe('Match pledge settlement @auth', () => {
  test.skip(true, 'Requires seeded in-progress event with active imbalanced match and matchmaker auth')

  test('records palitada on underdog and shows updated inside odds', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /matching/i }).first().click()
    await page.getByRole('tab', { name: 'Active Match' }).click()

    await page.getByRole('button', { name: 'Bet Balancing' }).click()
    await page.getByLabel('Contributor name').fill('VIP Test')
    await page.locator('input[name="amount"]').fill('2000')
    await page.getByRole('button', { name: 'Add Palitada' }).click()

    await expect(page.getByText('Palitada recorded')).toBeVisible()
    await expect(page.getByText('Total winning pool')).toBeVisible()
    await expect(page.getByText('inside odds')).toBeVisible()
  })

  test('persists inside odds after result is declared', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /matching/i }).first().click()
    await page.getByRole('tab', { name: 'Active Match' }).click()

    await page.getByRole('button', { name: /Declare.*win|Declare Draw/i }).first().click()

    await expect(page.getByText('Persisted inside odds')).toBeVisible()
  })
})
