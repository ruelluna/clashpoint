'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  changePromoterStatusSchema,
  createPromoterSchema,
  linkPromoterUserSchema,
  updatePromoterSchema,
} from '@/features/promoters/schema'
import {
  changeStatus,
  createPromoter,
  linkUser,
  updatePromoter,
} from '@/features/promoters/service'
import { requirePermission } from '@/lib/auth/permissions'

export type PromoterActionState = { error?: string; success?: string }

function parseCommissionValue(formData: FormData): number | undefined {
  const raw = formData.get('commissionValue')?.toString().trim()
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isNaN(value) ? undefined : value
}

function parsePromoterFields(formData: FormData) {
  return {
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson')?.toString().trim() || undefined,
    phone: formData.get('phone')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    address: formData.get('address')?.toString().trim() || undefined,
    commissionType: formData.get('commissionType'),
    commissionValue: parseCommissionValue(formData),
    notes: formData.get('notes')?.toString().trim() || undefined,
  }
}

export async function createPromoterAction(
  _prev: PromoterActionState,
  formData: FormData
): Promise<PromoterActionState> {
  const profile = await requirePermission('promoters.manage')

  const parsed = createPromoterSchema.safeParse({
    ...parsePromoterFields(formData),
    giveLoginAccess: formData.get('giveLoginAccess') === 'on',
    loginEmail: formData.get('loginEmail')?.toString().trim() || undefined,
    loginPassword: formData.get('loginPassword')?.toString() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createPromoter(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/promoters')
  redirect(`/dashboard/promoters/${result.promoterId}`)
}

export async function updatePromoterAction(
  _prev: PromoterActionState,
  formData: FormData
): Promise<PromoterActionState> {
  const profile = await requirePermission('promoters.manage')

  const parsed = updatePromoterSchema.safeParse({
    promoterId: formData.get('promoterId'),
    ...parsePromoterFields(formData),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updatePromoter(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/promoters')
  revalidatePath(`/dashboard/promoters/${parsed.data.promoterId}`)
  revalidatePath('/dashboard/audit')
  return { success: 'Promoter updated' }
}

export async function changePromoterStatusAction(
  _prev: PromoterActionState,
  formData: FormData
): Promise<PromoterActionState> {
  const profile = await requirePermission('promoters.manage')

  const parsed = changePromoterStatusSchema.safeParse({
    promoterId: formData.get('promoterId'),
    status: formData.get('status'),
    reason: formData.get('reason')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await changeStatus(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/promoters')
  revalidatePath(`/dashboard/promoters/${parsed.data.promoterId}`)
  revalidatePath('/dashboard/audit')
  return { success: 'Status updated' }
}

export async function linkPromoterUserAction(
  _prev: PromoterActionState,
  formData: FormData
): Promise<PromoterActionState> {
  const profile = await requirePermission('promoters.manage')

  const parsed = linkPromoterUserSchema.safeParse({
    promoterId: formData.get('promoterId'),
    loginEmail: formData.get('loginEmail'),
    loginPassword: formData.get('loginPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await linkUser(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/promoters')
  revalidatePath(`/dashboard/promoters/${parsed.data.promoterId}`)
  revalidatePath('/dashboard/audit')
  return { success: 'Login access granted' }
}
