'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  createCompetitorSchema,
  deleteCompetitorSchema,
  searchCompetitorsSchema,
  updateCompetitorSchema,
} from '@/features/competitors/schema'
import {
  createCompetitor,
  softDeleteCompetitor,
  updateCompetitor,
} from '@/features/competitors/service'
import { searchCompetitors } from '@/features/competitors/queries'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import { requirePermission } from '@/lib/auth/permissions'

export type CompetitorActionState = { error?: string; success?: string }

function parseOwnerProfileFields(formData: FormData) {
  return {
    displayName: formData.get('displayName'),
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    address: formData.get('address')?.toString().trim() || undefined,
    notes: formData.get('notes')?.toString().trim() || undefined,
  }
}

export async function searchCompetitorsAction(
  query: string
): Promise<{ error?: string; results?: CompetitorSearchResult[] }> {
  await requirePermission('entries.manage')

  const parsed = searchCompetitorsSchema.safeParse({ query })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid search query' }
  }

  const results = await searchCompetitors(parsed.data.query, parsed.data.limit)
  return { results }
}

export async function createCompetitorAction(input: {
  displayName: string
  contactNumber?: string
  email?: string
  address?: string
  notes?: string
}): Promise<{ error?: string; competitor?: CompetitorSearchResult }> {
  const profile = await requirePermission('entries.manage')

  const parsed = createCompetitorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createCompetitor(profile.id, parsed.data)
  if (result.error || !result.competitorId) {
    return { error: result.error ?? 'Failed to create owner' }
  }

  return {
    competitor: {
      id: result.competitorId,
      displayName: parsed.data.displayName,
      contactNumber: parsed.data.contactNumber ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
    },
  }
}

export async function createOwnerPageAction(
  _prev: CompetitorActionState,
  formData: FormData
): Promise<CompetitorActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = createCompetitorSchema.safeParse(parseOwnerProfileFields(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createCompetitor(profile.id, parsed.data)
  if (result.error || !result.competitorId) {
    return { error: result.error ?? 'Failed to create owner' }
  }

  revalidatePath('/dashboard/owners')
  redirect(`/dashboard/owners/${result.competitorId}`)
}

export async function updateOwnerPageAction(
  _prev: CompetitorActionState,
  formData: FormData
): Promise<CompetitorActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = updateCompetitorSchema.safeParse({
    id: formData.get('id'),
    ...parseOwnerProfileFields(formData),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateCompetitor(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/owners')
  revalidatePath(`/dashboard/owners/${parsed.data.id}`)
  return { success: 'Owner updated' }
}

export async function deleteOwnerPageAction(
  _prev: CompetitorActionState,
  formData: FormData
): Promise<CompetitorActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = deleteCompetitorSchema.safeParse({
    id: formData.get('id'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await softDeleteCompetitor(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/owners')
  redirect('/dashboard/owners')
}
