import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'
import {
  fillPublicRoosterCoreFields,
  fillStaffRoosterCoreFields,
} from './helpers/rooster-core-fields'

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

async function fillPublicRegistration(
  page: Page,
  ownerName: string,
  contactFullName: string,
  handlerName: string,
  suffix: string
) {
  await page.locator('input[name="ownerName"]').fill(ownerName)
  await page.locator('input[name="contactFullName"]').fill(contactFullName)
  await page.locator('input[name="contactDesignation"]').fill('Manager')
  await page.locator('input[name="handlerName_rooster_1"]').fill(handlerName)
  await page.locator('input[name="rooster_1_entryName"]').fill(`Rooster ${suffix}`)
  await page.locator('input[name="rooster_1_bandNumber"]').fill(`B-${suffix}`)
  await page.locator('input[name="rooster_1_weight"]').fill('2000')
  await fillPublicRoosterCoreFields(page, suffix)
}

test.describe('Public derby registration @auth', () => {
  test('submits online entry and blocks duplicate owner', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Register ${suffix}`
    const ownerName = `Owner ${suffix}`
    const contactFullName = `Contact ${suffix}`
    const handlerName = `Handler ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, eventName)

    await page.goto(`/events/${eventId}/register`)
    await expect(page.getByRole('heading', { name: /Register for/i })).toBeVisible()

    await fillPublicRegistration(page, ownerName, contactFullName, handlerName, suffix)
    await page.getByRole('button', { name: 'Submit registration' }).click()

    await expect(page.getByText('Registration submitted')).toBeVisible({ timeout: 15_000 })

    await page.goto(`/events/${eventId}/register`)
    await fillPublicRegistration(page, ownerName, contactFullName, handlerName, `B-${suffix}`)
    await page.getByRole('button', { name: 'Submit registration' }).click()

    await expect(
      page.getByText('already registered for this event', { exact: false })
    ).toBeVisible()
  })

  test('blocks same owner with a different rooster handler', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Owner Dup ${suffix}`
    const ownerName = `Owner ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, eventName)

    await page.goto(`/events/${eventId}/register`)
    await fillPublicRegistration(page, ownerName, `Contact A ${suffix}`, `Handler A ${suffix}`, suffix)
    await page.getByRole('button', { name: 'Submit registration' }).click()
    await expect(page.getByText('Registration submitted')).toBeVisible({ timeout: 15_000 })

    await page.goto(`/events/${eventId}/register`)
    await page.locator('input[name="ownerName"]').fill(ownerName)
    await page.locator('input[name="contactFullName"]').fill(`Contact B ${suffix}`)
    await page.locator('input[name="handlerName_rooster_1"]').fill(`Handler B ${suffix}`)
    await page.locator('input[name="rooster_1_entryName"]').fill(`Rooster B ${suffix}`)
    await page.locator('input[name="rooster_1_bandNumber"]').fill(`B2-${suffix}`)
    await page.locator('input[name="rooster_1_weight"]').fill('2100')
    await fillPublicRoosterCoreFields(page, `${suffix}-b`)
    await page.getByRole('button', { name: 'Submit registration' }).click()

    await expect(
      page.getByText('already registered for this event', { exact: false })
    ).toBeVisible()
  })

  test('shows closed message for draft events', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Draft ${suffix}`

    await signInAsAdmin(page)
    await page.goto('/dashboard/events/new')
    await page.locator('input[name="name"]').fill(eventName)
    await page.locator('input[name="eventDate"]').fill('2026-12-20T10:00')

    const eventTypeSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Classic' }) })
    await eventTypeSelect.selectOption('derby')
    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    const eventId = page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')

    await page.goto(`/events/${eventId}/register`)
    await expect(page.getByText('Registration closed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit registration' })).toHaveCount(0)
  })
})
