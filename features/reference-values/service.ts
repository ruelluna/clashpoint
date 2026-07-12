import 'server-only'

import {
  findOrCreateReferenceValueSchema,
  normalizeReferenceValueName,
} from '@/features/reference-values/schema'
import type { ReferenceValueKind } from '@/features/reference-values/types'
import { createClient } from '@/lib/supabase/server'

export async function findOrCreateReferenceValue(
  kind: ReferenceValueKind,
  rawName: string | null | undefined
): Promise<string | null> {
  const trimmed = rawName?.trim()
  if (!trimmed) return null

  const parsed = findOrCreateReferenceValueSchema.safeParse({ kind, name: trimmed })
  if (!parsed.success) return trimmed.slice(0, 200)

  const supabase = await createClient()
  const normalizedName = normalizeReferenceValueName(parsed.data.name)

  const { data: existing, error: existingError } = await supabase
    .from('reference_values')
    .select('id, name')
    .eq('kind', kind)
    .eq('normalized_name', normalizedName)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing.name as string

  const { data: inserted, error: insertError } = await supabase
    .from('reference_values')
    .insert({
      kind,
      name: parsed.data.name,
      normalized_name: normalizedName,
    })
    .select('name')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced, error: raceError } = await supabase
        .from('reference_values')
        .select('name')
        .eq('kind', kind)
        .eq('normalized_name', normalizedName)
        .maybeSingle()

      if (raceError) throw raceError
      return (raced?.name as string | undefined) ?? parsed.data.name
    }
    throw insertError
  }

  return inserted.name as string
}

export async function createReferenceValue(
  kind: ReferenceValueKind,
  rawName: string
): Promise<{ id: string; name: string }> {
  const trimmed = rawName.trim()
  const parsed = findOrCreateReferenceValueSchema.safeParse({ kind, name: trimmed })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid reference value')
  }

  const supabase = await createClient()
  const normalizedName = normalizeReferenceValueName(parsed.data.name)

  const { data: existing, error: existingError } = await supabase
    .from('reference_values')
    .select('id, name')
    .eq('kind', kind)
    .eq('normalized_name', normalizedName)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) {
    return { id: existing.id as string, name: existing.name as string }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('reference_values')
    .insert({
      kind,
      name: parsed.data.name,
      normalized_name: normalizedName,
    })
    .select('id, name')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced, error: raceError } = await supabase
        .from('reference_values')
        .select('id, name')
        .eq('kind', kind)
        .eq('normalized_name', normalizedName)
        .maybeSingle()

      if (raceError) throw raceError
      if (!raced) throw insertError
      return { id: raced.id as string, name: raced.name as string }
    }
    throw insertError
  }

  return { id: inserted.id as string, name: inserted.name as string }
}

export async function catalogReferenceValues(
  input: {
    breed?: string | null
    bloodline?: string | null
    colorMarking?: string | null
  }
): Promise<{
  breed: string | null
  bloodline: string | null
  colorMarking: string | null
}> {
  const [breed, bloodline, colorMarking] = await Promise.all([
    findOrCreateReferenceValue('breed', input.breed),
    findOrCreateReferenceValue('bloodline', input.bloodline),
    findOrCreateReferenceValue('color_marking', input.colorMarking),
  ])

  return { breed, bloodline, colorMarking }
}
