import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

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
  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)
  return page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
}

async function fillContactSuffix(page: Page, suffix: string) {
  await page.getByPlaceholder('12345678').fill(suffix.replace(/\D/g, '').slice(0, 8))
}

async function createEntryWithRooster(
  page: Page,
  eventId: string,
  label: string,
  suffix: string,
  band: string,
  options?: {
    ownerName?: string
    roosterName?: string
    handlerName?: string
    saveOwner?: boolean
    contactSuffix?: string
  }
) {
  await page.getByRole('link', { name: 'New entry' }).click()
  const ownerName = options?.ownerName ?? `${label} Owner`
  const roosterName = options?.roosterName ?? `${label} Rooster ${suffix}`
  await page.locator('input[name="ownerName"]').fill(ownerName)
  if (options?.saveOwner) {
    await page.getByLabel('Save owner for future entries').check()
  }
  if (options?.contactSuffix) {
    await fillContactSuffix(page, options.contactSuffix)
  }
  if (options?.handlerName) {
    await page.locator('input[name="handlerName"]').fill(options.handlerName)
  }
  await page.locator('input[name="rooster_1_entryName"]').fill(roosterName)
  await page.locator('input[name="rooster_1_bandNumber"]').fill(band)
  await page.locator('input[name="rooster_1_weight"]').fill('2.10')
  await page.getByRole('button', { name: 'Save entry' }).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
  await expect(page.getByText(ownerName)).toBeVisible({ timeout: 15_000 })
}

test.describe('Rooster entries → matching @auth', () => {
  test('registers entries with roosters, pairs match, and advances queue', async ({
    page,
  }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Workflow ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createClassicEvent(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries`)
    await expect(page.getByText('Rooster Entries')).toBeVisible()

    await createEntryWithRooster(page, eventId, 'Meron', suffix, `M-${suffix}`)
    await createEntryWithRooster(page, eventId, 'Wala', suffix, `W-${suffix}`)

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

    await page.getByRole('button', { name: 'Lock match list' }).click()
    await expect(page.getByText('Locked', { exact: false })).toBeVisible({
      timeout: 15_000,
    })

    await expect(page.getByText('Fight queue')).toBeVisible()
    await page.getByRole('button', { name: /Mark called/i }).click()
    await expect(page.getByText('Called', { exact: false })).toBeVisible({ timeout: 15_000 })
  })

  test('edits and deletes an entry before matching', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Edit Delete ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createClassicEvent(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries`)
    await createEntryWithRooster(page, eventId, 'EditMe', suffix, `E-${suffix}`)
    await createEntryWithRooster(page, eventId, 'DeleteMe', suffix, `D-${suffix}`)

    await page.getByRole('link', { name: 'Edit' }).first().click()
    await page.locator('input[name="ownerName"]').fill('Updated Owner')
    await page.getByRole('button', { name: 'Save entry' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
    await expect(page.getByText('Updated Owner')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    const deleteRow = page.locator('div').filter({ hasText: 'DeleteMe Owner' })
    await deleteRow.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('DeleteMe Owner')).toHaveCount(0, {
      timeout: 15_000,
    })
  })

  test('redirects legacy registrations and weighing routes to rooster entries', async ({
    page,
  }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events')
    const firstEventLink = page.locator('a[href*="/dashboard/events/"]').first()
    await firstEventLink.click()
    await page.waitForURL(eventDetailUrl)

    const eventId = page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
    await page.goto(`/dashboard/events/${eventId}/registrations`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))

    await page.goto(`/dashboard/events/${eventId}/weighing`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))
  })

  test('saves an owner for reuse and allows different handlers per entry', async ({
    page,
  }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Saved Owner ${suffix}`
    const savedOwnerName = `Saved Owner ${suffix}`
    const contactSuffix = suffix.replace(/\D/g, '').slice(0, 8).padStart(8, '1')

    await signInAsAdmin(page)
    const eventId = await createClassicEvent(page, eventName)

    await page.goto(`/dashboard/events/${eventId}/rooster-entries`)
    await createEntryWithRooster(page, eventId, 'First', suffix, `F-${suffix}`, {
      ownerName: savedOwnerName,
      saveOwner: true,
      contactSuffix,
      handlerName: `Handler A ${suffix}`,
    })

    await createEntryWithRooster(page, eventId, 'Second', suffix, `S-${suffix}`, {
      handlerName: `Handler B ${suffix}`,
    })

    await page.getByRole('link', { name: 'New entry' }).click()
    await page.locator('input[name="ownerName"]').fill(savedOwnerName)
    await expect(page.getByText(savedOwnerName).first()).toBeVisible({ timeout: 15_000 })
    await page.getByText(savedOwnerName).first().click()
    await expect(page.locator('input[name="contactNumber"]')).toHaveValue(`69${contactSuffix}`)
    await expect(page.getByLabel('Save owner for future entries')).toHaveCount(0)

    await page.locator('input[name="rooster_1_entryName"]').fill(`Third Rooster ${suffix}`)
    await page.locator('input[name="handlerName"]').fill(`Handler C ${suffix}`)
    await page.locator('input[name="rooster_1_bandNumber"]').fill(`T-${suffix}`)
    await page.locator('input[name="rooster_1_weight"]').fill('2.10')
    await page.getByRole('button', { name: 'Save entry' }).click()
    await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/rooster-entries`))

    await expect(page.getByText(savedOwnerName)).toHaveCount(3, { timeout: 15_000 })
    await expect(page.getByText(`Handler A ${suffix}`)).toBeVisible()
    await expect(page.getByText(`Handler B ${suffix}`)).toBeVisible()
    await expect(page.getByText(`Handler C ${suffix}`)).toBeVisible()
  })
})
