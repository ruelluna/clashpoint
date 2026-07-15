import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'
import { fillStaffRoosterCoreFields } from './helpers/rooster-core-fields'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function uniqueSuffix() {
  return Date.now().toString(36)
}

async function createOpenDerbyEvent(page: Page, name: string) {
  await page.goto('/dashboard/events/new')
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-20T10:00')
  await page.locator('input[name="registrationDeadline"]').fill('2026-12-19T18:00')

  const eventTypeSelect = page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
  await eventTypeSelect.selectOption('derby')

  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)

  const eventId = page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')

  await page.goto(`/dashboard/events/${eventId}/edit`)
  await page.locator('input[name="legalAuthorized"]').check()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('button', { name: 'Mark Open' }).click()
  await expect(page.getByText('Open', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  })

  return eventId
}

async function registerOwnerForEvent(
  page: Page,
  eventId: string,
  ownerName: string,
  contactFullName: string
) {
  await page.goto(`/dashboard/events/${eventId}/owners/new`)
  await page.locator('input[name="ownerName"]').fill(ownerName)
  await page.locator('input[name="contactFullName"]').fill(contactFullName)
  await page.locator('input[name="contactDesignation"]').fill('Manager')
  await page.getByRole('button', { name: 'Register owner' }).click()
  await page.waitForURL(new RegExp(`/dashboard/events/${eventId}/owners/[^/]+/print`))
}

test.describe('Event roosters owner scan @auth', () => {
  test('selects owner by barcode and adds rooster', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Roosters Scan ${suffix}`
    const ownerName = `Farm ${suffix}`
    const bandNumber = `BAND-${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, eventName)
    await registerOwnerForEvent(page, eventId, ownerName, `Contact ${suffix}`)

    const barcodeText = await page.locator('text=/^OWN-/').first().innerText()

    await page.goto(`/dashboard/events/${eventId}/roosters`)
    await expect(page.getByRole('heading', { name: 'Roosters' })).toBeVisible()
    await expect(page.getByTestId('event-owner-entry-picker')).toBeVisible()

    await page.getByTestId('owner-barcode-scan-input').fill(barcodeText)
    await page.getByRole('button', { name: 'Look up barcode' }).click()

    await expect(page.getByTestId('owner-rooster-check-panel')).toBeVisible()
    await expect(page.getByText(ownerName)).toBeVisible()
    await expect(page.getByText('No roosters registered for this owner yet.')).toBeVisible()

    const ownerPicker = page.getByTestId('event-owner-entry-picker').getByRole('combobox')
    await expect(ownerPicker).toHaveValue(new RegExp(ownerName))

    await page.locator('input[name="bandNumber"]').fill(bandNumber)
    await fillStaffRoosterCoreFields(page, suffix)
    await page.getByRole('button', { name: 'Add rooster' }).click()

    await page.waitForURL(new RegExp(`/dashboard/events/${eventId}/roosters/[^/]+/print`))

    await page.goto(`/dashboard/events/${eventId}/roosters`)
    await page.getByTestId('owner-barcode-scan-input').fill(barcodeText)
    await page.getByRole('button', { name: 'Look up barcode' }).click()

    await expect(page.getByTestId('owner-rooster-check-panel')).toContainText('1 of')
    await expect(page.getByTestId('owner-rooster-check-panel')).toContainText(bandNumber)
  })

  test('searches owners in the picker combobox', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const ownerName = `Search Farm ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, `E2E Roosters Search ${suffix}`)
    await registerOwnerForEvent(page, eventId, ownerName, `Contact ${suffix}`)

    await page.goto(`/dashboard/events/${eventId}/roosters`)
    const ownerPicker = page.getByTestId('event-owner-entry-picker').getByRole('combobox')
    await ownerPicker.fill(ownerName)
    await page.getByRole('option', { name: new RegExp(ownerName) }).click()
    await expect(page.getByTestId('owner-rooster-check-panel')).toContainText(ownerName)
  })
})
