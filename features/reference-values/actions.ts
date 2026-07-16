'use server'

import { revalidatePath } from 'next/cache'

import { writeAuditLog } from '@/features/audit/service'
import {
  createReferenceValueSettingsSchema,
  deleteReferenceValueSchema,
  findOrCreateReferenceValueSchema,
  searchReferenceValuesSchema,
} from '@/features/reference-values/schema'
import { searchReferenceValues } from '@/features/reference-values/queries'
import {
  createReferenceValue,
  deleteReferenceValue,
} from '@/features/reference-values/service'
import type { ReferenceValueSearchResult } from '@/features/reference-values/types'
import { requirePermission } from '@/lib/auth/permissions'

export async function searchReferenceValuesAction(input: {
  kind: 'breed' | 'bloodline' | 'color_marking'
  query: string
}): Promise<{ error?: string; results?: ReferenceValueSearchResult[] }> {
  await requirePermission('entries.manage')

  const parsed = searchReferenceValuesSchema.safeParse({
    kind: input.kind,
    query: input.query,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid search query' }
  }

  try {
    const results = await searchReferenceValues(
      parsed.data.kind,
      parsed.data.query,
      parsed.data.limit
    )

    return { results }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : 'Failed to search reference values'

    return { error: message }
  }
}

export async function createReferenceValueAction(input: {
  kind: 'breed' | 'bloodline' | 'color_marking'
  name: string
}): Promise<{ error?: string; value?: ReferenceValueSearchResult }> {
  await requirePermission('entries.manage')

  const parsed = findOrCreateReferenceValueSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const value = await createReferenceValue(parsed.data.kind, parsed.data.name)
    return { value }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : 'Failed to save reference value'

    return { error: message }
  }
}

export async function createReferenceValueSettingsAction(input: {
  kind: 'breed' | 'color_marking'
  name: string
}): Promise<{ error?: string; value?: ReferenceValueSearchResult }> {
  const profile = await requirePermission('settings.manage')

  const parsed = createReferenceValueSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const value = await createReferenceValue(parsed.data.kind, parsed.data.name)
    await writeAuditLog({
      actorId: profile.id,
      action: 'reference_value.created',
      entityType: 'reference_value',
      entityId: value.id,
      newValues: { kind: parsed.data.kind, name: value.name },
    })
    revalidatePath('/dashboard/settings')
    return { value }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : 'Failed to save option'

    return { error: message }
  }
}

export async function deleteReferenceValueAction(input: {
  id: string
}): Promise<{ error?: string; success?: string }> {
  const profile = await requirePermission('settings.manage')

  const parsed = deleteReferenceValueSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await deleteReferenceValue(parsed.data.id)
  if (result.error) return { error: result.error }

  await writeAuditLog({
    actorId: profile.id,
    action: 'reference_value.deleted',
    entityType: 'reference_value',
    entityId: parsed.data.id,
  })

  revalidatePath('/dashboard/settings')
  return { success: 'Option removed' }
}
