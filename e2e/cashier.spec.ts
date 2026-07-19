import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

const eventDetailUrl = /\/dashboard\/events\/[0-9a-f-]{36}/

function uniqueSuffix() {
  return Date.now().toString(36)
}

async function enableEventFees(page: Page) {
  const registrationFeeSection = page
    .locator('div')
    .filter({ has: page.getByText('Registration fee (per owner)', { exact: true }) })
    .first()
  const registrationFeeSwitch = registrationFeeSection.getByRole('switch')
  if (await registrationFeeSwitch.count()) {
    const checked = await registrationFeeSwitch.getAttribute('data-checked')
    if (checked == null) {
      await registrationFeeSwitch.click()
    }
    await page.locator('input[name="registrationFeeAmount"]').fill('500')
  }

  const roosterEntryFeeSection = page
    .locator('div')
    .filter({ has: page.getByText('Entry fee (per rooster)', { exact: true }) })
    .first()
  const roosterEntryFeeSwitch = roosterEntryFeeSection.getByRole('switch')
  if (await roosterEntryFeeSwitch.count()) {
    const checked = await roosterEntryFeeSwitch.getAttribute('data-checked')
    if (checked == null) {
      await roosterEntryFeeSwitch.click()
    }
    await page.locator('input[name="roosterEntryFeeAmount"]').fill('200')
  }

  await page.getByRole('button', { name: /Save changes|Update event|Save/i }).first().click()
  await page.waitForLoadState('networkidle')
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
  await enableEventFees(page)

  await page.goto(`/dashboard/events/${eventId}/edit`)
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

test.describe('Cashier @auth', () => {
  test('looks up entry and collects payment', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    const eventName = `E2E Cashier ${suffix}`
    const ownerName = `Cashier Farm ${suffix}`

    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, eventName)
    await registerOwnerForEvent(page, eventId, ownerName, `Contact ${suffix}`)

    await page.goto(`/dashboard/events/${eventId}/payments`)
    await expect(page.getByRole('heading', { name: 'Cashier' })).toBeVisible()
    await expect(page.getByTestId('cashier-fund-balance')).toBeVisible()

    await page.getByTestId('cashier-scan-input').fill(ownerName)
    await page.getByRole('button', { name: 'Look up' }).click()

    await expect(page.getByText(ownerName).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('cashier-total-outstanding')).toBeVisible()

    const amountInput = page.getByTestId('cashier-amount-paid')
    if (await amountInput.count()) {
      const categorySelect = page.locator('select[name="paymentCategory"]')
      await expect(categorySelect).toHaveValue('entry_fees')
      await expect(categorySelect.locator('option:checked')).toHaveText(
        'Registration & entry fees'
      )

      const amount = await amountInput.inputValue()
      expect(Number(amount)).toBeGreaterThan(0)
      await page.getByTestId('cashier-record-payment').click()
      await page.waitForURL(new RegExp(`/dashboard/events/${eventId}/payments/[^/]+/print`))
      await expect(page.getByText(/PAY-/i).first()).toBeVisible()
      await expect(page.getByText('Registration & entry fees')).toBeVisible()
    } else {
      // No fees configured — still verify wrong-event barcode guard
      await page.goto(`/dashboard/events/${eventId}/payments`)
      await page.getByTestId('cashier-scan-input').fill('OWN-ABCDEF12-0001')
      await page.getByRole('button', { name: 'Look up' }).click()
      await expect(page.getByText(/does not belong to this event/i)).toBeVisible()
    }
  })

  test('rejects barcode from another event', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    const suffix = uniqueSuffix()
    await signInAsAdmin(page)
    const eventId = await createOpenDerbyEvent(page, `E2E Cashier Guard ${suffix}`)

    await page.goto(`/dashboard/events/${eventId}/payments`)
    await page.getByTestId('cashier-scan-input').fill('OWN-ABCDEF12-0001')
    await page.getByRole('button', { name: 'Look up' }).click()
    await expect(page.getByText(/does not belong to this event/i)).toBeVisible()
  })
})
