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
  test('creates minimal entry then validates eligibility on edit', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Entry Eligibility ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createDerbyEventWithEligibility(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/new`)

    await page.locator('input[name="ownerName"]').fill(`Owner ${suffix}`)
    await page.locator('input[name="rooster_1_entryName"]').fill(`Rooster ${suffix}`)
    await page.locator('input[name="rooster_1_bandNumber"]').fill(`B-${suffix}`)
    await page.locator('input[name="rooster_1_weight"]').fill('1500')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page.getByText('Weight is below the event minimum', { exact: false })).toBeVisible()

    await page.locator('input[name="rooster_1_weight"]').fill('2000')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
    await expect(page.getByText(`Owner ${suffix}`)).toBeVisible({ timeout: 15_000 })

    await page.getByRole('link', { name: 'Edit' }).first().click()
    await page.locator('select[name^="ageClass_"]').first().selectOption('stag')
    await page.locator('input[name="rooster_1_weight"], input[name^="weight_"]').first().fill('1500')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page.getByText('Weight is below the event minimum', { exact: false })).toBeVisible()

    await page.locator('input[name^="weight_"]').first().fill('2000')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
    await expect(page.getByText(`Owner ${suffix}`)).toBeVisible({ timeout: 15_000 })
  })
})
