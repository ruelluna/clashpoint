import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function uniqueSuffix() {
  return Date.now().toString(36)
}

async function markEventPublicAndOpen(page: Page, eventId: string) {
  await page.goto(`/dashboard/events/${eventId}/edit`)
  await page.locator('input[name="legalAuthorized"]').check()
  const publicCheckbox = page.locator('input[name="isPublic"]')
  if (!(await publicCheckbox.isChecked())) {
    await publicCheckbox.check()
  }
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('button', { name: 'Mark Open' }).click()
  await expect(page.getByText('Open', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  })
}

async function createOpenPublicEvent(
  page: Page,
  name: string,
  eventType: 'derby' | 'classic' = 'derby'
) {
  await page.goto('/dashboard/events/new')
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-20T10:00')

  if (eventType === 'derby') {
    await page.locator('input[name="registrationDeadline"]').fill('2026-12-19T18:00')
  }

  const eventTypeSelect = page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
  await eventTypeSelect.selectOption(eventType)

  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)

  const eventId = page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
  await markEventPublicAndOpen(page, eventId)
  return eventId
}

async function fillNewGameFarmStep(
  page: Page,
  ownerName: string,
  email: string,
  contactFullName: string
) {
  await page.getByRole('tab', { name: 'New game farm' }).click()
  await page.locator('input[name="ownerName"]').fill(ownerName)
  await page.locator('input[name="contactFullName"]').fill(contactFullName)
  await page.locator('input[name="contactDesignation"]').fill('Manager')
  await page.locator('input[name="email"]').fill(email)
}

async function fillRoosterStep(page: Page, handlerName: string, suffix: string) {
  await page.locator('input[name="handlerName_rooster_1"]').fill(handlerName)
  await page.locator('input[name="rooster_1_entryName"]').fill(`Rooster ${suffix}`)
  await page.locator('input[name="rooster_1_bandNumber"]').fill(`B-${suffix}`)
  await page.locator('input[name="rooster_1_weight"]').fill('2000')
}

test.describe('Public staged registration @auth', () => {
  test('derby: new game farm then rooster registration', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Register ${suffix}`
    const ownerName = `Farm ${suffix}`
    const email = `farm-${suffix}@example.com`
    const contactFullName = `Contact ${suffix}`
    const handlerName = `Handler ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenPublicEvent(page, eventName, 'derby')

    await page.goto(`/events/${eventId}/register`)
    await expect(page.getByText('Step 1 — Game farm')).toBeVisible()

    await fillNewGameFarmStep(page, ownerName, email, contactFullName)
    await page.getByRole('button', { name: 'Continue to rooster registration' }).click()

    await expect(page.getByText('Step 2 — Rooster registration')).toBeVisible({
      timeout: 15_000,
    })

    await fillRoosterStep(page, handlerName, suffix)
    await page.getByRole('button', { name: 'Submit rooster registration' }).click()

    await expect(page.getByText('Registration submitted')).toBeVisible({ timeout: 15_000 })
  })

  test('classic: register tab visible and staged flow works', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Classic ${suffix}`
    const ownerName = `Classic Farm ${suffix}`
    const email = `classic-${suffix}@example.com`

    await signInAsAdmin(page)
    const eventId = await createOpenPublicEvent(page, eventName, 'classic')

    await page.goto(`/events/${eventId}`)
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()

    await page.goto(`/events/${eventId}/register`)
    await fillNewGameFarmStep(page, ownerName, email, `Contact ${suffix}`)
    await page.getByRole('button', { name: 'Continue to rooster registration' }).click()

    await expect(page.getByText('Step 2 — Rooster registration')).toBeVisible({
      timeout: 15_000,
    })

    await fillRoosterStep(page, `Handler ${suffix}`, suffix)
    await page.getByRole('button', { name: 'Submit rooster registration' }).click()

    await expect(page.getByText('Registration submitted')).toBeVisible({ timeout: 15_000 })
  })

  test('blocks duplicate game farm on second rooster attempt', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Public Dup ${suffix}`
    const ownerName = `Farm ${suffix}`
    const email = `dup-${suffix}@example.com`

    await signInAsAdmin(page)
    const eventId = await createOpenPublicEvent(page, eventName, 'derby')

    await page.goto(`/events/${eventId}/register`)
    await fillNewGameFarmStep(page, ownerName, email, `Contact ${suffix}`)
    await page.getByRole('button', { name: 'Continue to rooster registration' }).click()
    await expect(page.getByText('Step 2 — Rooster registration')).toBeVisible({
      timeout: 15_000,
    })
    await fillRoosterStep(page, `Handler ${suffix}`, suffix)
    await page.getByRole('button', { name: 'Submit rooster registration' }).click()
    await expect(page.getByText('Registration submitted')).toBeVisible({ timeout: 15_000 })

    await page.goto(`/events/${eventId}/register`)
    await fillNewGameFarmStep(page, ownerName, `other-${email}`, `Other ${suffix}`)
    await page.getByRole('button', { name: 'Continue to rooster registration' }).click()

    await expect(
      page.getByText('already registered for this event', { exact: false })
    ).toBeVisible({ timeout: 15_000 })
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
    await expect(page.getByRole('button', { name: 'Submit rooster registration' })).toHaveCount(0)
  })
})
