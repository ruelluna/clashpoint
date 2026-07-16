import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'
import {
  fillBreedCombobox,
  fillRoosterColorField,
  fillRoosterNotesField,
} from './helpers/rooster-core-fields'

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

async function registerDerbyOwner(page: Page, eventId: string, ownerName: string) {
  await page.goto(`/dashboard/events/${eventId}/owners/new`)
  await page.locator('input[name="ownerName"]').fill(ownerName)
  await page.getByRole('button', { name: 'Register owner' }).click()
  await page.waitForURL(new RegExp(`/dashboard/events/${eventId}/owners/[0-9a-f-]{36}/print`))
  return page.url().match(/owners\/([0-9a-f-]{36})/)?.[1] ?? ''
}

test.describe('Rooster entry eligibility @auth', () => {
  test('validates weight policy when editing an entry roster', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Entry Eligibility ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createDerbyEventWithEligibility(page, eventName)
    const entryId = await registerDerbyOwner(page, eventId, `Owner ${suffix}`)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/${entryId}/edit`)
    await page.locator('input[name="new_rooster_1_entryName"]').fill(`Rooster ${suffix}`)
    await page.locator('input[name="new_rooster_1_bandNumber"]').fill(`B-${suffix}`)
    await page.locator('input[name="new_rooster_1_weight"]').fill('1500')
    await fillBreedCombobox(page, 'Talisayon')
    await fillRoosterColorField(page, 'Black')
    await fillRoosterNotesField(page, `Cock note ${suffix}`)
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page.getByText('Weight is below the event minimum', { exact: false })).toBeVisible()

    await page.locator('input[name="new_rooster_1_weight"]').fill('2000')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/roosters`))
    await expect(page.getByText(`B-${suffix}`)).toBeVisible({ timeout: 15_000 })

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/${entryId}/edit`)
    await expect(page.locator('textarea[name^="notes_"]').first()).toHaveValue(`Cock note ${suffix}`)
    await page.locator('select[name^="ageClass_"]').first().selectOption('stag')
    await page.locator('input[name^="weight_"]').first().fill('1500')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page.getByText('Weight is below the event minimum', { exact: false })).toBeVisible()

    await page.locator('input[name^="weight_"]').first().fill('2000')
    await page.getByRole('button', { name: 'Save entry' }).click()

    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/roosters`))
    await expect(page.getByText(`B-${suffix}`)).toBeVisible({ timeout: 15_000 })
  })

  test('staff entry edit uses color from settings catalog', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Catalog Color ${suffix}`
    const catalogColor = `E2E Color ${suffix}`

    await signInAsAdmin(page)

    await page.goto('/dashboard/settings')
    const colorSection = page.getByTestId('settings-color-options')
    await colorSection.locator('input').fill(catalogColor)
    await colorSection.getByRole('button', { name: 'Add' }).click()
    await expect(colorSection.getByText(catalogColor)).toBeVisible({ timeout: 10_000 })

    const eventId = await createDerbyEventWithEligibility(page, eventName)
    const entryId = await registerDerbyOwner(page, eventId, `Owner ${suffix}`)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/${entryId}/edit`)
    await page.locator('input[name="new_rooster_1_entryName"]').fill(`Rooster ${suffix}`)
    await page.locator('input[name="new_rooster_1_bandNumber"]').fill(`B-${suffix}`)
    await page.locator('input[name="new_rooster_1_weight"]').fill('2000')
    await fillBreedCombobox(page, 'Buyugon')
    await fillRoosterColorField(page, catalogColor)
    await fillRoosterNotesField(page, `Color test ${suffix}`)

    await page.getByRole('button', { name: 'Save entry' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/roosters`))
    await expect(page.getByText(catalogColor)).toBeVisible({ timeout: 15_000 })
  })
})
