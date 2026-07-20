import { test, expect } from '@playwright/test'

test.describe('Bet Balancing pit', () => {
  test.skip('staff with palitada permission can open pit and record VIP Palitada @auth', async ({
    page,
  }) => {
    await page.goto('/dashboard/events')
    // Requires seeded event, waiting fight, and staff storageState with matches.palitada.manage
    await expect(page.getByRole('heading', { name: 'Bet Balancing' })).toBeVisible()
  })
})
