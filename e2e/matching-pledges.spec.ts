import { expect, test } from '@playwright/test'

test.describe('Matching pledges flow @auth', () => {
  test.skip(true, 'Requires seeded matchmaker + cashier auth and in-progress event with verified roosters')

  test('matchmaker creates match and cashier collects pledge via cock scan', async ({
    page,
  }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /matching/i }).first().click()
    await expect(page.getByRole('heading', { name: 'Matching' })).toBeVisible()

    await page.getByTestId('matching-meron-scan-input').fill('COCK-00000000-0001')
    await page.getByRole('button', { name: 'Look up barcode' }).first().click()

    await page.getByTestId('matching-wala-scan-input').fill('COCK-00000000-0002')
    await page.getByRole('button', { name: 'Look up barcode' }).nth(1).click()

    await page.locator('input[name="meronBet"]').fill('500')
    await page.locator('input[name="walaBet"]').fill('750')
    await page.getByRole('button', { name: 'Create match & print slips' }).click()

    await expect(page.getByText('PLEDGE')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0)

    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /cashier|payments/i }).first().click()
    await page.getByTestId('cashier-scan-input').fill('COCK-00000000-0001')
    await page.getByRole('button', { name: 'Look up' }).click()
    await expect(page.getByTestId('cashier-pledge-due')).toBeVisible()
  })

  test('cashier collects pledge via BET slip scan', async ({ page }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /cashier|payments/i }).first().click()
    await page.getByTestId('cashier-scan-input').fill('BET-00000000-0001-M')
    await page.getByRole('button', { name: 'Look up' }).click()
    await expect(page.getByTestId('cashier-pledge-due')).toBeVisible()
  })

  test('cashier settles pledge adjustment after matching staff changes amount', async ({
    page,
  }) => {
    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /matching/i }).first().click()
    await page.getByRole('button', { name: 'Save pledge changes' }).first().click()

    await page.goto('/dashboard/events')
    await page.getByRole('link', { name: /cashier|payments/i }).first().click()
    await page.getByTestId('cashier-scan-input').fill('BET-00000000-0001-M')
    await page.getByRole('button', { name: 'Look up' }).click()
    await expect(page.getByTestId('cashier-pledge-adjustment-due')).toBeVisible()
  })
})
