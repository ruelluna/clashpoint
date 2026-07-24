import { expect, test } from '@playwright/test'

import {
  hasAdminCredentials,
  signInAsAdmin,
  signInAsEventOrganizer,
  signInWithCredentials,
} from './fixtures/auth'
import {
  createCashierStaffTestUser,
  deleteTestUser,
  hasServiceRoleCredentials,
} from './helpers/test-users'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

async function createMinimalEvent(
  page: import('@playwright/test').Page,
  name: string,
  revolvingFundInitial = 0
) {
  await page.goto('/dashboard/events/new')
  await page.locator('input[name="name"]').fill(name)
  await page.locator('input[name="eventDate"]').fill('2026-12-20T10:00')
  await page.locator('input[name="registrationDeadline"]').fill('2026-12-19T18:00')

  const eventTypeSelect = page
    .locator('select')
    .filter({ has: page.locator('option', { hasText: 'Classic' }) })
  await eventTypeSelect.selectOption('derby')

  if (revolvingFundInitial > 0) {
    await page.locator('input[name="revolvingFundInitial"]').fill(String(revolvingFundInitial))
  }

  await page.getByRole('button', { name: 'Create event' }).click()
  await page.waitForURL(eventDetailUrl)

  return page.url().replace(/.*\/events\//, '').replace(/\/.*$/, '')
}

test.describe('Revolving fund staff access @auth', () => {
  test('hides revolving fund tab and blocks direct URL for cashier staff', async ({
    page,
  }) => {
    test.skip(
      !hasServiceRoleCredentials(),
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for staff access tests'
    )

    const suffix = Date.now().toString(36)
    const eventName = `E2E Revolving Fund Access ${suffix}`
    const cashierStaff = await createCashierStaffTestUser()

    try {
      await signInAsEventOrganizer(page)
      const eventId = await createMinimalEvent(page, eventName)

      await signInWithCredentials(page, cashierStaff.email, cashierStaff.password)
      await expect(page).toHaveURL(/\/dashboard(\?|$)/, { timeout: 15_000 })

      await page.goto(`/dashboard/events/${eventId}`)
      await expect(page.getByRole('link', { name: 'Cashier Terminal' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Revolving fund' })).not.toBeVisible()

      await page.goto(`/dashboard/events/${eventId}/revolving-fund`)
      await expect(page).toHaveURL(/\/access-denied(\?|$)/)
      await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
    } finally {
      await deleteTestUser(cashierStaff.id)
    }
  })
})

test.describe('Revolving fund balance visibility @auth', () => {
  test('hides balance card and row balances for event organizers', async ({ page }) => {
    test.skip(
      !hasServiceRoleCredentials(),
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for organizer balance tests'
    )

    const suffix = Date.now().toString(36)
    const eventName = `E2E Revolving Fund Organizer Balance ${suffix}`
    const organizer = await signInAsEventOrganizer(page)

    try {
      const eventId = await createMinimalEvent(page, eventName, 200_000)

      await page.goto(`/dashboard/events/${eventId}/revolving-fund`)
      await expect(page.getByRole('heading', { name: 'Revolving fund' })).toBeVisible()
      await expect(page.getByText('Current balance')).not.toBeVisible()
      await expect(page.getByText(/^Balance:/)).not.toBeVisible()
      await expect(page.getByText('Opening')).toBeVisible()
    } finally {
      await deleteTestUser(organizer.id)
    }
  })

  test('shows balance card and row balances for system owner admin', async ({ page }) => {
    test.skip(
      !hasAdminCredentials(),
      'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD for admin balance tests'
    )

    const suffix = Date.now().toString(36)
    const eventName = `E2E Revolving Fund Admin Balance ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createMinimalEvent(page, eventName, 200_000)

    await page.goto(`/dashboard/events/${eventId}/revolving-fund`)
    await expect(page.getByRole('heading', { name: 'Revolving fund' })).toBeVisible()
    await expect(page.getByText('Current balance')).toBeVisible()
    await expect(page.getByText(/^Balance:/)).toBeVisible()
  })
})
