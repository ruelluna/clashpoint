/**
 * Optional dev seed for the first system owner.
 * Run: npm run seed:first-admin
 *
 * Env (all optional):
 *   SEED_FIRST_ADMIN_EMAIL     default: ruelluna@gmail.com
 *   SEED_FIRST_ADMIN_PASSWORD  default: password
 *   SEED_FIRST_ADMIN_DISPLAY_NAME default: Ruel Luna
 *   SEED_FIRST_ADMIN_UPDATE_PASSWORD default: true — reset password when user already exists
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(relativePath) {
  const filePath = path.join(process.cwd(), relativePath)
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

function envFlag(name, defaultValue = false) {
  const raw = process.env[name]
  if (raw == null || raw === '') return defaultValue
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes'
}

async function findUserByEmail(supabase, email) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )
    if (match) return match

    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.'
    )
    process.exit(1)
  }

  const email = process.env.SEED_FIRST_ADMIN_EMAIL ?? 'ruelluna@gmail.com'
  const password = process.env.SEED_FIRST_ADMIN_PASSWORD ?? 'password'
  const displayName = process.env.SEED_FIRST_ADMIN_DISPLAY_NAME ?? 'Ruel Luna'
  const updatePassword = envFlag('SEED_FIRST_ADMIN_UPDATE_PASSWORD', true)

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: needsBootstrap, error: bootstrapError } =
    await supabase.rpc('needs_bootstrap')

  if (bootstrapError) {
    console.error('Unable to verify bootstrap state:', bootstrapError.message)
    process.exit(1)
  }

  if (needsBootstrap) {
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      })

    if (createError || !created.user) {
      if (createError?.message?.toLowerCase().includes('already been registered')) {
        const existing = await findUserByEmail(supabase, email)
        if (!existing) {
          console.error('Email already registered but user lookup failed.')
          process.exit(1)
        }

        if (updatePassword) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existing.id,
            { password }
          )
          if (updateError) {
            console.error('Failed to update password for existing user:', updateError.message)
            process.exit(1)
          }
          console.log(`Updated password for existing bootstrap user ${email}`)
          process.exit(0)
        }

        console.log(`User ${email} already exists. Set SEED_FIRST_ADMIN_UPDATE_PASSWORD=true to reset password.`)
        process.exit(0)
      }

      console.error('Failed to create first admin:', createError?.message ?? 'unknown error')
      process.exit(1)
    }

    console.log(`Created first admin ${email} (user id: ${created.user.id})`)
    process.exit(0)
  }

  const existing = await findUserByEmail(supabase, email)
  if (!existing) {
    console.log(
      'A system owner already exists and seed email is not registered. Skipping optional seed.'
    )
    process.exit(0)
  }

  if (!updatePassword) {
    console.log(`Admin already exists. Seed user ${email} is present; password left unchanged.`)
    process.exit(0)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
  })

  if (updateError) {
    console.error('Failed to update password:', updateError.message)
    process.exit(1)
  }

  console.log(`Admin already exists. Updated password for ${email} to match seed defaults.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
