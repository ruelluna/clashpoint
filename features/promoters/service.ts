import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type {
  ChangePromoterStatusInput,
  CreatePromoterInput,
  LinkPromoterUserInput,
  UpdatePromoterInput,
} from '@/features/promoters/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function commissionValueForDb(
  commissionType: CreatePromoterInput['commissionType'],
  commissionValue?: number
): number | null {
  if (commissionType === 'none') return null
  return commissionValue ?? null
}

async function createPromoterUser(
  name: string,
  loginEmail: string,
  loginPassword: string
): Promise<{ userId?: string; error?: string }> {
  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser(
    {
      email: loginEmail,
      password: loginPassword,
      email_confirm: true,
    }
  )

  if (createError || !created.user) {
    return { error: createError?.message ?? 'Failed to create login account' }
  }

  const supabase = await createClient()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'promoter',
      display_name: name,
    })
    .eq('id', created.user.id)

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: 'Failed to assign promoter role' }
  }

  return { userId: created.user.id }
}

export async function createPromoter(
  actorId: string,
  input: CreatePromoterInput
): Promise<{ error?: string; promoterId?: string }> {
  let userId: string | null = null

  if (input.giveLoginAccess) {
    const userResult = await createPromoterUser(
      input.name,
      input.loginEmail!,
      input.loginPassword!
    )
    if (userResult.error) return { error: userResult.error }
    userId = userResult.userId ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promoters')
    .insert({
      name: input.name,
      contact_person: input.contactPerson ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      status: 'active',
      commission_type: input.commissionType,
      commission_value: commissionValueForDb(
        input.commissionType,
        input.commissionValue
      ),
      notes: input.notes ?? null,
      user_id: userId,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (userId) {
      const admin = createAdminClient()
      await admin.auth.admin.deleteUser(userId)
    }
    return { error: error?.message ?? 'Failed to create promoter' }
  }

  await writeAuditLog({
    actorId,
    action: 'promoter.created',
    entityType: 'promoter',
    entityId: data.id,
    newValues: {
      name: input.name,
      status: 'active',
      commission_type: input.commissionType,
      has_login: !!userId,
    },
  })

  return { promoterId: data.id }
}

export async function updatePromoter(
  actorId: string,
  input: UpdatePromoterInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('promoters')
    .select(
      'name, contact_person, phone, email, address, status, commission_type, commission_value, notes'
    )
    .eq('id', input.promoterId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Promoter not found' }

  const { error } = await supabase
    .from('promoters')
    .update({
      name: input.name,
      contact_person: input.contactPerson ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      status: input.status,
      commission_type: input.commissionType,
      commission_value: commissionValueForDb(
        input.commissionType,
        input.commissionValue
      ),
      notes: input.notes ?? null,
    })
    .eq('id', input.promoterId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'promoter.updated',
    entityType: 'promoter',
    entityId: input.promoterId,
    oldValues: existing,
    newValues: {
      name: input.name,
      contact_person: input.contactPerson ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      status: input.status,
      commission_type: input.commissionType,
      commission_value: commissionValueForDb(
        input.commissionType,
        input.commissionValue
      ),
      notes: input.notes ?? null,
    },
  })

  return {}
}

export async function changeStatus(
  actorId: string,
  input: ChangePromoterStatusInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('promoters')
    .select('status')
    .eq('id', input.promoterId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Promoter not found' }

  const { error } = await supabase
    .from('promoters')
    .update({ status: input.status })
    .eq('id', input.promoterId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'promoter.status_changed',
    entityType: 'promoter',
    entityId: input.promoterId,
    oldValues: { status: existing.status },
    newValues: { status: input.status },
    reason: input.reason,
  })

  return {}
}

export async function linkUser(
  actorId: string,
  input: LinkPromoterUserInput
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('promoters')
    .select('id, name, user_id')
    .eq('id', input.promoterId)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Promoter not found' }
  if (existing.user_id) return { error: 'Promoter already has login access' }

  const userResult = await createPromoterUser(
    existing.name,
    input.loginEmail,
    input.loginPassword
  )
  if (userResult.error) return { error: userResult.error }

  const { error } = await supabase
    .from('promoters')
    .update({ user_id: userResult.userId })
    .eq('id', input.promoterId)

  if (error) {
    const admin = createAdminClient()
    if (userResult.userId) {
      await admin.auth.admin.deleteUser(userResult.userId)
    }
    return { error: error.message }
  }

  await writeAuditLog({
    actorId,
    action: 'promoter.user_linked',
    entityType: 'promoter',
    entityId: input.promoterId,
    newValues: { user_id: userResult.userId, login_email: input.loginEmail },
  })

  return {}
}
