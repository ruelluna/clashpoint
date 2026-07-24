import { expect, test } from '@playwright/test'

test.describe('Matching VIP settling @auth', () => {
  test.skip(
    true,
    'Requires seeded event with VIP Palitada, recorded result, and matchmaker auth'
  )

  test('shows VIP payments in Settling and blocks settle until paid', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /matching/i }).first().click()
    await page.getByRole('tab', { name: 'Settling' }).click()

    await expect(page.getByText('VIP payments')).toBeVisible()
    await page.getByRole('button', { name: 'Mark paid' }).first().click()
    await expect(page.getByText('VIP payment marked complete')).toBeVisible()

    await page.getByRole('button', { name: 'Mark match settled' }).click()
    await expect(page.getByText('Match marked settled')).toBeVisible()
  })

  test('shows settlement details on Results after match settled', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /results/i }).first().click()

    await page.getByRole('button', { name: 'View details' }).first().click()
    await expect(page.getByText('Settlement details')).toBeVisible()
    await expect(page.getByText('VIP Palitada')).toBeVisible()
    await expect(page.getByText('Match settled')).toBeVisible()
  })
})
