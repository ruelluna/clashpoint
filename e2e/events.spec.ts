import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function eventTypeSelect(page: Page) {
  return page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
}

async function fillBaseEventFields(page: Page, name: string) {
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-01T10:00')
}

test.describe('Event creation type @auth', () => {
  test('redirects unauthenticated visits to login', async ({ page }) => {
    await page.goto('/dashboard/events/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('toggles derby fields based on selected event type', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events/new')

    await expect(page.getByText('Derby type', { exact: true })).toBeVisible()
    await expect(page.getByText('Prize structure', { exact: true })).toBeVisible()
    await expect(page.getByText('Registration rules', { exact: true })).toBeVisible()

    await eventTypeSelect(page).selectOption('classic')

    await expect(page.getByText('Derby type', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Prize structure', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Registration rules', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Registration deadline', { exact: true })).toHaveCount(0)

    await eventTypeSelect(page).selectOption('derby')

    await expect(page.getByText('Derby type', { exact: true })).toBeVisible()
    await expect(page.getByText('Prize structure', { exact: true })).toBeVisible()
  })

  test('shows cocks per entry only for custom derby type', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events/new')

    await expect(page.getByText('Cocks per entry', { exact: true })).toHaveCount(0)

    await page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Custom' }) })
      .selectOption('custom')

    await expect(page.locator('input[name="cocksPerEntry"]')).toBeVisible()
  })

  test('creates a classic event', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events/new')

    await fillBaseEventFields(page, 'E2E Classic Event')
    await eventTypeSelect(page).selectOption('classic')
    await page.getByRole('button', { name: 'Create event' }).click()

    await page.waitForURL(eventDetailUrl)
    await expect(page.getByText('Classic')).toBeVisible()
  })

  test('creates a derby event', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)
    await page.goto('/dashboard/events/new')

    await fillBaseEventFields(page, 'E2E Derby Event')
    await eventTypeSelect(page).selectOption('derby')
    await page.getByRole('button', { name: 'Create event' }).click()

    await page.waitForURL(eventDetailUrl)
    await expect(page.getByText('Derby')).toBeVisible()
  })
})
