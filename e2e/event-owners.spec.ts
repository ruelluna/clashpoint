import { expect, test, type Page } from '@playwright/test'

import { hasAdminCredentials, signInAsAdmin } from './fixtures/auth'

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

async function createSavedOwner(page: Page, ownerName: string) {
    await page.goto('/dashboard/owners/new')
    await page.getByLabel('Owner name / game farm').fill(ownerName)
    await page.getByRole('button', { name: 'Save owner' }).click()
    await expect(page.getByRole('heading', { name: ownerName })).toBeVisible()
}

test.describe('Event owners list @auth', () => {
    test('filters owners by search and looks up barcode', async ({ page }) => {
        test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

        const suffix = uniqueSuffix()
        const eventName = `E2E Event Owners ${suffix}`
        const ownerName = `Farm ${suffix}`
        const contactFullName = `Contact ${suffix}`

        await signInAsAdmin(page)
        const eventId = await createOpenDerbyEvent(page, eventName)
        await registerOwnerForEvent(page, eventId, ownerName, contactFullName)

        const barcodeText = await page.locator('text=/^OWN-/').first().innerText()
        const entryUrl = page.url().replace(/\/print$/, '')
        const entryId = entryUrl.split('/').pop()!

        await page.goto(`/dashboard/events/${eventId}/owners`)
        await expect(page.getByRole('heading', { name: 'Owners' })).toBeVisible()

        await page.getByPlaceholder('Filter by owner, contact, entry #, or barcode').fill(
            ownerName
        )
        await expect(page.getByText(ownerName)).toBeVisible()
        await expect(page.getByText(contactFullName)).toBeVisible()

        await page
            .getByPlaceholder('Scan OWNER barcode or type and press Enter')
            .fill(barcodeText)
        await page.getByRole('button', { name: 'Look up barcode' }).click()

        await expect(page).toHaveURL(new RegExp(`/dashboard/events/${eventId}/owners/${entryId}$`))
    })

    test('blocks registering the same owner twice for an event', async ({ page }) => {
        test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

        const suffix = uniqueSuffix()
        const eventName = `E2E Owner Dup ${suffix}`
        const ownerName = `Farm Dup ${suffix}`

        await signInAsAdmin(page)
        const eventId = await createOpenDerbyEvent(page, eventName)
        await registerOwnerForEvent(page, eventId, ownerName, `Contact A ${suffix}`)

        await page.goto(`/dashboard/events/${eventId}/owners/new`)
        await page.locator('input[name="ownerName"]').fill(ownerName)
        await page.locator('input[name="contactFullName"]').fill(`Contact B ${suffix}`)
        await page.getByRole('button', { name: 'Register owner' }).click()

        await expect(
            page.getByText('already registered for this event', { exact: false })
        ).toBeVisible()
    })

    test('owner picker shows saved owners on click and filters while typing', async ({ page }) => {
        test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

        const suffix = uniqueSuffix()
        const eventName = `E2E Owner Picker ${suffix}`
        const ownerName = `Picker Farm ${suffix}`
        const otherOwnerName = `Other Farm ${suffix}`

        await signInAsAdmin(page)
        await createSavedOwner(page, ownerName)
        await createSavedOwner(page, otherOwnerName)
        const eventId = await createOpenDerbyEvent(page, eventName)

        await page.goto(`/dashboard/events/${eventId}/owners/new`)

        const ownerPicker = page.getByTestId('owner-picker').getByRole('combobox')
        await ownerPicker.click()
        await expect(page.getByRole('option', { name: ownerName })).toBeVisible({
            timeout: 15_000,
        })
        await expect(page.getByRole('option', { name: otherOwnerName })).toBeVisible()

        await ownerPicker.fill('Picker')
        await expect(page.getByRole('option', { name: ownerName })).toBeVisible()
        await expect(page.getByRole('option', { name: otherOwnerName })).toHaveCount(0)

        await ownerPicker.fill('')
        await expect(page.getByRole('option', { name: ownerName })).toBeVisible()
        await expect(page.getByRole('option', { name: otherOwnerName })).toBeVisible()

        await ownerPicker.fill('zzznomatch')
        await expect(page.getByText('No owners match this search')).toBeVisible()
    })
})
