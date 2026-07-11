import { expect, test } from '@playwright/test'

import {
  adminCredentials,
  gotoLoginPage,
  hasAdminCredentials,
  signInAsAdmin,
  signInWithCredentials,
} from './fixtures/auth'
import {
  canManageProfiles,
  countSystemOwners,
  createProfileLessTestUser,
  createStaffTestUser,
  deleteTestUser,
  hasServiceRoleCredentials,
  removeProfileForUser,
} from './helpers/test-users'

const staffAccessDeniedMessage = 'Access denied. Staff account required.'

test.describe('Auth login @auth', () => {
  test('redirects unauthenticated dashboard visits to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })

  test('shows sign-in form when a system owner already exists', async ({ page }) => {
    await gotoLoginPage(page)

    const bootstrapHeading = page.getByRole('heading', {
      name: 'Create your first admin account',
    })

    if (await bootstrapHeading.isVisible()) {
      test.skip(true, 'Database has no system owner; bootstrap form is shown instead')
    }

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(bootstrapHeading).not.toBeVisible()
  })

  test('creates first admin when database has no system owner', async ({ page }) => {
    test.skip(
      process.env.PLAYWRIGHT_BOOTSTRAP_TEST !== 'true' ||
        !hasServiceRoleCredentials(),
      'Set PLAYWRIGHT_BOOTSTRAP_TEST=true and SUPABASE_SERVICE_ROLE_KEY on an empty database'
    )

    const ownerCount = await countSystemOwners()
    test.skip(
      ownerCount > 0,
      'Database must have no system owner profile for bootstrap test'
    )

    const email = `e2e-bootstrap-${Date.now()}@clashpoint.test`
    const password = `Bootstrap-${crypto.randomUUID()}`

    await gotoLoginPage(page)
    await expect(
      page.getByRole('heading', { name: 'Create your first admin account' })
    ).toBeVisible()
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Display name').fill('Bootstrap Admin')
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Confirm password').fill(password)
    await page.getByRole('button', { name: 'Create admin account' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true })
    ).toBeVisible()

    const {
      data: { users },
    } = await (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ).auth.admin.listUsers({ page: 1, perPage: 100 })

    const createdUser = users.find((user) => user.email === email)

    if (createdUser) {
      await deleteTestUser(createdUser.id)
    }
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInWithCredentials(
      page,
      adminCredentials.email,
      'wrong-password-value'
    )

    await expect(page).toHaveURL(/\/login(\?|$)/)
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('signs in as admin and reaches dashboard', async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    await signInAsAdmin(page)

    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true })
    ).toBeVisible()
    await expect(page.getByText(/^Signed in as /)).toBeVisible()
  })

  test('sign-in rejects profile-less account', async ({ page }) => {
    test.skip(
      !hasServiceRoleCredentials() || !(await canManageProfiles()),
      'Set SUPABASE_SERVICE_ROLE_KEY with profiles table access for profile-less auth tests'
    )

    const testUser = await createProfileLessTestUser()

    try {
      await removeProfileForUser(testUser.id)

      await signInWithCredentials(page, testUser.email, testUser.password)

      await expect(page).toHaveURL(/\/login(\?|$)/)
      await expect(page.getByText(staffAccessDeniedMessage)).toBeVisible()
    } finally {
      await deleteTestUser(testUser.id)
    }
  })

  test('authenticated session without profile reaches access denied on dashboard', async ({
    page,
  }) => {
    test.skip(
      !hasServiceRoleCredentials() || !(await canManageProfiles()),
      'Set SUPABASE_SERVICE_ROLE_KEY with profiles table access for profile-less auth tests'
    )

    const testUser = await createStaffTestUser()

    try {
      await signInWithCredentials(page, testUser.email, testUser.password)
      await expect(page).toHaveURL(/\/dashboard/)

      await removeProfileForUser(testUser.id)

      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/access-denied/)
      await expect(
        page.getByRole('heading', { name: 'Access denied' })
      ).toBeVisible()
    } finally {
      await deleteTestUser(testUser.id)
    }
  })
})
