import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'
import { fillStaffRoosterCoreFields } from './helpers/rooster-core-fields'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function uniqueSuffix() {
  return Date.now().toString(36)
}

async function createClassicEvent(page: Page, name: string) {
  await page.goto('/dashboard/events/new')
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-15T10:00')
  await page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
    .selectOption('classic')

  const inspectionSection = page
    .locator('div')
    .filter({ hasText: 'Physical inspection required' })
    .first()
  await inspectionSection.getByRole('switch').click()

  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)
  await expect(page.getByRole('link', { name: 'Inspection' })).toBeVisible()
  return page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
}

async function fillContactSuffix(page: Page, suffix: string) {
  await page.getByPlaceholder('9171234567').fill(suffix.replace(/\D/g, '').slice(0, 10))
}

async function registerOwner(page: Page, eventId: string, ownerName: string) {
  await page.goto(`/dashboard/events/${eventId}/owners/new`)
  await page.locator('input[name="ownerName"]').fill(ownerName)
  await page.getByRole('button', { name: 'Register owner' }).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/owners`))
  await expect(page.getByText(ownerName)).toBeVisible({ timeout: 15_000 })
}

async function addRooster(page: Page, eventId: string, band: string) {
  await page.goto(`/dashboard/events/${eventId}/roosters`)
  await page.getByTestId('roosters-add-toggle').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const ownerPicker = page.getByTestId('event-owner-entry-picker').getByRole('combobox')
  await ownerPicker.click()
  await page.getByRole('option').first().click()
  await page.locator('input[name="bandNumber"]').fill(band)
  await fillStaffRoosterCoreFields(page, band)
  await page.getByTestId('roosters-save-button').click()
  await expect(page.getByText(band)).toBeVisible({ timeout: 15_000 })
}

async function completeInspectionForEntry(page: Page, eventId: string, searchText: string) {
  await page.goto(`/dashboard/events/${eventId}/inspection`)
  await page.getByTestId('inspection-rooster-search-input').fill(searchText)
  await page.getByRole('button', { name: 'Find' }).click()
  const row = page.locator('[data-registration-id]').first()
  await row.locator('input[name="officialWeight"]').fill('2100')
  await row.getByRole('button', { name: 'Record' }).click()
  await expect(row.getByText('Weight recorded', { exact: false })).toBeVisible({
    timeout: 15_000,
  })
  await row.getByTestId('inspection-approve-button').click()
  await expect(row.getByText('Inspection recorded', { exact: false })).toBeVisible({
    timeout: 15_000,
  })
  await expect(row.getByTestId('inspection-open-button')).toHaveText('Edit inspection')
}

test.describe('Owners → roosters → inspection → matching @auth', () => {
  test('registers owners and roosters, completes inspection, and pairs a match', async ({
    page,
  }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Registration Tabs ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createClassicEvent(page, eventName)

    const meronOwner = `Meron Owner ${suffix}`
    const walaOwner = `Wala Owner ${suffix}`

    await registerOwner(page, eventId, meronOwner)
    await addRooster(page, eventId, `M-${suffix}`)
    await completeInspectionForEntry(page, eventId, meronOwner)

    await registerOwner(page, eventId, walaOwner)
    await addRooster(page, eventId, `W-${suffix}`)
    await completeInspectionForEntry(page, eventId, walaOwner)

    await page.goto(`/dashboard/events/${eventId}/matching`)
    await expect(page.getByText('Matching', { exact: true })).toBeVisible()

    const meronSelect = page.locator('select[name="meronRoosterId"]')
    const walaSelect = page.locator('select[name="walaRoosterId"]')

    await meronSelect.selectOption({ index: 1 })
    await walaSelect.selectOption({ index: 1 })
    await page.locator('input[name="meronBet"]').fill('500')
    await page.locator('input[name="walaBet"]').fill('500')
    await page.getByRole('button', { name: 'Add match' }).click()
    await expect(page.getByText('Match created', { exact: false })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('redirects legacy registrations and weighing routes to roosters', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events')
    const firstEventLink = page.locator('a[href*="/dashboard/events/"]').first()
    await firstEventLink.click()
    await page.waitForURL(eventDetailUrl)

    const eventId = page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
    await page.goto(`/dashboard/events/${eventId}/registrations`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/roosters`))

    await page.goto(`/dashboard/events/${eventId}/weighing`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/roosters`))

    await page.goto(`/dashboard/events/${eventId}/rooster-entries/new`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/owners/new`))
  })

  test('reuses saved owner from Add new dialog on owner registration', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Saved Owner ${suffix}`
    const savedOwnerName = `Saved Owner ${suffix}`
    const contactSuffix = `917${suffix.replace(/\D/g, '').slice(0, 7).padEnd(7, '1')}`

    await signInAsAdmin(page)
    const eventId = await createClassicEvent(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/owners/new`)
    await page.getByRole('button', { name: 'Add new' }).click()
    await page.getByRole('dialog').locator('input').first().fill(savedOwnerName)
    await fillContactSuffix(page, contactSuffix)
    await page.getByRole('button', { name: 'Save owner' }).click()
    await page.getByRole('button', { name: 'Register owner' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/owners`))

    await page.goto(`/dashboard/events/${eventId}/owners/new`)
    await page.locator('input[name="ownerName"]').fill(savedOwnerName)
    await expect(page.getByText(savedOwnerName).first()).toBeVisible({ timeout: 15_000 })
    await page.getByText(savedOwnerName).first().click()
    await expect(page.locator('input[name="contactNumber"]')).toHaveValue(`+63${contactSuffix}`)
  })
})
