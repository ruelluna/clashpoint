import { expect, test, type Page } from '@playwright/test'

import {
  canRunSeededEventTests,
  hasAdminCredentials,
  signInAsAdmin,
  signInAsEventOrganizer,
} from './fixtures/auth'
import { deleteTestUser, canManageProfiles } from './helpers/test-users'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/
const eventEditUrl = /\/dashboard\/events\/[0-9a-f-]{36}\/edit/

function eventTypeSelect(page: Page) {
  return page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
}

function derbyFormatSelect(page: Page) {
  return page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: '2-Cock' }) })
}

function derbyAgeProfileSelect(page: Page) {
  return page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Stag Derby' }) })
}

async function signInForEventTests(page: Page) {
  if (hasAdminCredentials()) {
    try {
      await signInAsAdmin(page)
      return null
    } catch {
      // Fall back to a seeded organizer when static admin creds are stale.
    }
  }

  if (!(await canManageProfiles())) {
    throw new Error(
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD in .env.local, or apply migration 202607121708_service_role_e2e_grants and set SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return signInAsEventOrganizer(page)
}

async function fillBaseEventFields(page: Page, name: string) {
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-01T10:00')
}

async function fillRegistrationRules(page: Page, firstLine: string, boldLine: string) {
  const editor = page.locator('.ProseMirror')
  await editor.click()
  await editor.pressSequentially(firstLine)
  await page.getByRole('button', { name: 'Bold' }).click()
  await editor.pressSequentially(` ${boldLine}`)
}

async function enableEligibilityField(page: Page, fieldLabel: string) {
  const descriptionSnippets: Record<string, string> = {
    'Age class': 'Restrict which age classes',
    'Weight limits': 'Set minimum and maximum weight',
    'Banding': 'Require bands and restrict',
    'Experience': 'Limit roosters by win history',
    'Origin & breeding': 'Control locally bred',
    'Association membership': 'Require competitors to belong',
    'Physical inspection': 'Require a passed physical inspection',
    'Entry fee payment': 'Registration fee must be paid',
  }

  const snippet = descriptionSnippets[fieldLabel]
  const section = snippet
    ? page.locator('div').filter({ hasText: new RegExp(`^${fieldLabel}${snippet}`) }).first()
    : page.locator('div').filter({ has: page.getByText(fieldLabel, { exact: true }) }).first()

  await section.getByRole('switch').click()
}

test.describe('Event creation type @auth', () => {
  let disposableUserId: string | null = null

  test.afterEach(async () => {
    if (disposableUserId) {
      await deleteTestUser(disposableUserId)
      disposableUserId = null
    }
  })

  test('redirects unauthenticated visits to login', async ({ page }) => {
    await page.goto('/dashboard/events/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('toggles derby fields based on selected event type', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    await expect(page.getByText('Derby format', { exact: true })).toBeVisible()
    await expect(page.getByText('Derby age profile', { exact: true })).toBeVisible()
    await expect(page.getByText('Prize structure', { exact: true })).toBeVisible()
    await expect(page.getByText('Registration rules', { exact: true })).toBeVisible()

    await eventTypeSelect(page).selectOption('classic')

    await expect(page.getByText('Registration deadline', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Prize structure', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Registration rules', { exact: true })).toHaveCount(0)
    await expect(page.locator('input[name="entryFee"]')).toHaveCount(0)

    await eventTypeSelect(page).selectOption('derby')

    await expect(page.getByText('Derby format', { exact: true })).toBeVisible()
    await expect(page.getByText('Prize structure', { exact: true })).toBeVisible()
  })

  test('shows cocks per entry only for custom derby type', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    await expect(page.getByText('Cocks per entry', { exact: true })).toBeVisible()
    await expect(page.locator('input[name="cocksPerEntry"]')).toHaveCount(0)

    await derbyFormatSelect(page).selectOption('custom')

    await expect(page.locator('input[name="cocksPerEntry"]')).toBeVisible()
  })

  test('creates a classic event', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    await fillBaseEventFields(page, 'E2E Classic Event')
    await eventTypeSelect(page).selectOption('classic')
    await page.getByRole('button', { name: 'Create event' }).click()

    await page.waitForURL(eventDetailUrl)
    await expect(page.getByText('Classic', { exact: true })).toBeVisible()
  })

  test('creates a derby event', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    await fillBaseEventFields(page, 'E2E Derby Event')
    await eventTypeSelect(page).selectOption('derby')
    await page.getByRole('button', { name: 'Create event' }).click()

    await page.waitForURL(eventDetailUrl)
    await expect(page.getByText('Derby · 2-Cock')).toBeVisible()
  })

  test('saves formatted registration rules on derby events', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Rules ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')
    await fillRegistrationRules(page, 'Entry fee due before weigh-in.', 'No late entries.')

    await page.getByRole('button', { name: 'Bullets' }).click()
    await page.locator('.ProseMirror').pressSequentially('Bring valid ID')

    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await expect(page.getByText('Registration rules', { exact: true })).toBeVisible()
    await expect(page.getByText('Entry fee due before weigh-in.')).toBeVisible()
    await expect(page.getByText('No late entries.')).toBeVisible()
    await expect(page.getByText('Bring valid ID')).toBeVisible()
  })

  test('edits and persists registration rules on derby events', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Edit Rules ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')
    await fillRegistrationRules(page, 'Initial rule text.', 'Initial bold text.')

    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await page.getByRole('link', { name: 'Edit event' }).click()
    await page.waitForURL(eventEditUrl)

    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.press('Control+A')
    await editor.pressSequentially('Updated rule text.')
    await page.getByRole('button', { name: 'Italic' }).click()
    await editor.pressSequentially(' Updated italic note.')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Event updated')).toBeVisible()

    await page.goto(page.url().replace('/edit', ''))
    await expect(page.getByText('Updated rule text.')).toBeVisible()
    await expect(page.getByText('Updated italic note.')).toBeVisible()
    await expect(page.getByText('Initial rule text.')).toHaveCount(0)
  })

  test('saves eligibility preset options when creating derby events', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Eligibility ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')

    await enableEligibilityField(page, 'Age class')

    const presetSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Add preset…' }) })
      .first()
    await presetSelect.selectOption({ label: 'Stag' })

    await expect(page.getByText('Stag', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await page.getByRole('link', { name: 'Edit event' }).click()
    await page.waitForURL(eventEditUrl)

    await expect(page.getByText('Stag', { exact: true })).toBeVisible()
  })

  test('saves entry fee and derby age profile on create', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Entry Fee ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')
    await derbyFormatSelect(page).selectOption('5_cock')
    await derbyAgeProfileSelect(page).selectOption('stag_derby')
    await page.locator('input[name="entryFee"]').fill('750')

    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await page.getByRole('link', { name: 'Edit event' }).click()
    await page.waitForURL(eventEditUrl)

    await expect(page.locator('input[name="entryFee"]')).toHaveValue('750')
    await expect(derbyAgeProfileSelect(page)).toHaveValue('stag_derby')
  })

  test('toggles eligibility sub-checkboxes on create and persists on edit', async ({
    page,
  }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Checkboxes ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')

    await enableEligibilityField(page, 'Weight limits')
    const weightVerification = page.getByRole('checkbox', {
      name: 'Require official weight verification',
    })
    await expect(weightVerification).not.toBeChecked()
    await weightVerification.click()
    await expect(weightVerification).toBeChecked()

    await enableEligibilityField(page, 'Banding')
    const bandRequired = page.getByRole('checkbox', { name: 'Band is required' })
    await bandRequired.click()
    await expect(bandRequired).toBeChecked()

    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await page.getByRole('link', { name: 'Edit event' }).click()
    await page.waitForURL(eventEditUrl)

    await expect(
      page.getByRole('checkbox', { name: 'Require official weight verification' })
    ).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Band is required' })).toBeChecked()
  })

  test('saves eligibility sub-checkboxes via standalone panel on edit', async ({ page }) => {
    test.skip(
      !(await canRunSeededEventTests()),
      'Set valid PLAYWRIGHT_ADMIN_EMAIL/PASSWORD or apply service_role E2E grants migration'
    )

    const organizer = await signInForEventTests(page)
    disposableUserId = organizer?.id ?? null
    await page.goto('/dashboard/events/new')

    const eventName = `E2E Derby Standalone Save ${Date.now()}`
    await fillBaseEventFields(page, eventName)
    await eventTypeSelect(page).selectOption('derby')
    await page.getByRole('button', { name: 'Create event' }).click()
    await page.waitForURL(eventDetailUrl)

    await page.getByRole('link', { name: 'Edit event' }).click()
    await page.waitForURL(eventEditUrl)

    const inspectionSection = page
      .locator('div')
      .filter({ hasText: 'Physical inspection required' })
      .first()
    await inspectionSection.getByRole('switch').click()

    await enableEligibilityField(page, 'Weight limits')
    const weightVerification = page.getByRole('checkbox', {
      name: 'Require official weight verification',
    })
    await weightVerification.click()
    await expect(weightVerification).toBeChecked()

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Event updated')).toBeVisible()
    await page.getByRole('button', { name: 'Save eligibility settings' }).click()
    await expect(page.getByText('Eligibility settings saved')).toBeVisible()

    await page.reload()
    await expect(inspectionSection.getByRole('switch')).toHaveAttribute('data-checked', '')
    await expect(weightVerification).toBeChecked()
  })
})
