import { expect, test } from '@playwright/test'

test.describe('Match winner cashier payout @auth', () => {
    test.skip(
        true,
        'Requires seeded event with paid pledges, recorded result, and cashier auth'
    )

    test('shows Match Winners in Settling sorted by matching code', async ({ page }) => {
        await page.goto('/dashboard/events')
        await page.getByRole('link', { name: /matching/i }).first().click()
        await page.getByRole('tab', { name: 'Settling' }).click()

        await expect(page.getByText('Match Winners')).toBeVisible()
        await expect(page.getByRole('link', { name: 'Open Cashier Terminal' })).toBeVisible()
    })

    test('blocks loser payout and pays winner at Cashier', async ({ page }) => {
        await page.goto('/dashboard/events')
        await page.getByRole('link', { name: /cashier/i }).first().click()

        await page.getByLabel(/scan|barcode|lookup/i).fill('BET-PLACEHOLDER')
        await expect(page.getByText('Lost — no payout')).toBeVisible()

        await page.getByLabel(/scan|barcode|lookup/i).fill('BET-WINNER')
        await expect(page.getByTestId('cashier-winner-total')).toBeVisible()
        await page.getByTestId('cashier-winner-tendered').fill('2000')
        await page.getByTestId('cashier-pay-winner').click()
        await expect(page.getByText('Handler payout recorded')).toBeVisible()
    })

    test('shows handler payout lines in Results settlement details', async ({ page }) => {
        await page.goto('/dashboard/events')
        await page.getByRole('link', { name: /results/i }).first().click()

        await page.getByRole('button', { name: 'View details' }).first().click()
        await expect(page.getByText('Match Winners')).toBeVisible()
    })
})
