import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function uniqueSuffix() {
  return Date.now().toString(36)
}

async function createDerbyEventWithEligibility(page: Page, name: string) {
  await page.goto('/dashboard/events/new')
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-20T10:00')

  const eventTypeSelect = page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
  await eventTypeSelect.selectOption('derby')

  const ageClassSection = page
    .locator('div')
    .filter({ hasText: /^Age classRestrict which age classes/ })
    .first()
  await ageClassSection.getByRole('switch').click()
  await page.locator('input[name="allowedAgeClasses"]').fill('stag,cock')

  const weightSection = page
    .locator('div')
    .filter({ hasText: /^Weight limitsSet minimum and maximum weight/ })
    .first()
  await weightSection.getByRole('switch').click()
  await page.locator('input[name="minimumWeightGrams"]').fill('1700')
  await page.locator('input[name="maximumWeightGrams"]').fill('2200')

  await page.locator('input[name="eligibilityEnforcementEnabled"]').check()

  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)
  return page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
}

test.describe('Rooster entry eligibility @auth', () => {
  test('blocks ineligible rooster and accepts eligible entry', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Entry Eligibility ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createDerbyEventWithEligibility(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/new`)

    await page.locator('input[name="entryName"]').fill(`Entry ${suffix}`)
    await page.locator('input[name="ownerName"]').fill(`Owner ${suffix}`)
    await page.locator('input[name="bandNumber"]').fill(`B-${suffix}`)
    await page.locator('input[name="weight"]').fill('1.50')
    await page.locator('select[name="ageClass"]').selectOption('stag')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page.getByText('Weight is below the event minimum', { exact: false })).toBeVisible()

    await page.locator('input[name="weight"]').fill('2.00')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
    await expect(page.getByText(`Entry ${suffix}`)).toBeVisible({ timeout: 15_000 })
  })
})
