import { expect, type Page } from '@playwright/test'

export async function fillBreedCombobox(
  page: Page,
  breed: string,
  root?: ReturnType<Page['locator']>
) {
  const scope = root ?? page
  const combobox = scope.getByTestId('reference-value-breed').getByRole('combobox')
  await combobox.fill(breed)
  await expect(page.getByRole('option', { name: breed })).toBeVisible({ timeout: 5000 })
  await page.getByRole('option', { name: breed }).click()
}

export async function fillRoosterColorField(
  page: Page,
  color: string,
  root?: ReturnType<Page['locator']>
) {
  const scope = root ?? page
  const combobox = scope.getByTestId('reference-value-color_marking').getByRole('combobox')
  await combobox.fill(color)
  const exactOption = page.getByRole('option', { name: color, exact: true })
  const useCustomOption = page.getByRole('option', { name: `Use "${color}"` })
  if (await exactOption.isVisible().catch(() => false)) {
    await exactOption.click()
    return
  }
  await expect(useCustomOption).toBeVisible({ timeout: 5000 })
  await useCustomOption.click()
}

export async function fillRoosterNotesField(
  page: Page,
  notes: string,
  root?: ReturnType<Page['locator']>
) {
  const scope = root ?? page
  await scope.getByLabel('Notes', { exact: true }).fill(notes)
}

export async function fillStaffRoosterCoreFields(page: Page, suffix = 'e2e') {
  await page.locator('input[name="entryName"]').fill(`Rooster ${suffix}`)
  await fillBreedCombobox(page, 'Talisayon')
  await fillRoosterColorField(page, 'Black')
  await fillRoosterNotesField(page, `Staff rooster note ${suffix}`)
}

export async function fillPublicRoosterCoreFields(page: Page, suffix = 'e2e') {
  const cockPanel = page.getByText('Cock #1').locator('..')
  await fillBreedCombobox(page, 'Buyugon', cockPanel)
  await fillRoosterColorField(page, 'Red', cockPanel)
  await fillRoosterNotesField(page, `Public rooster note ${suffix}`, cockPanel)
}
