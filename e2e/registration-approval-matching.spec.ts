import { test, expect } from '@playwright/test'

test.describe('Registration approval and matching @auth', () => {
  test.skip(true, 'Requires seeded organizer auth and open derby event with approval enabled')

  test('organizer can open registration review queue', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /registrations/i }).first().click()
    await expect(page.getByRole('heading', { name: /registration review/i })).toBeVisible()
  })
})
