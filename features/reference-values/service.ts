import 'server-only'

import {
  findOrCreateReferenceValueSchema,
  normalizeReferenceValueName,
} from '@/features/reference-values/schema'
import type { ReferenceValueKind } from '@/features/reference-values/types'
import type { PublicReferenceOptions } from '@/features/reference-values/catalog'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type ReferenceSupabase = SupabaseClient<Database>

export type CatalogResolutionOptions =
  | { mode: 'strict' }
  | ({ mode: 'public' } & PublicReferenceOptions)

type ReferenceWriteOptions = {
  useAdminClient?: boolean
}

async function resolveClient(options?: ReferenceWriteOptions): Promise<ReferenceSupabase> {
  if (options?.useAdminClient) {
    return createAdminClient()
  }
  return createClient()
}

function catalogKindLabel(kind: ReferenceValueKind): string {
  if (kind === 'breed') return 'Breed'
  if (kind === 'color_marking') return 'Color'
  return 'Value'
}

export class ReferenceValueNotInCatalogError extends Error {
  constructor(kind: ReferenceValueKind, name: string) {
    super(
      `${catalogKindLabel(kind)} "${name}" is not in the catalog. Add it in Settings first.`
    )
    this.name = 'ReferenceValueNotInCatalogError'
  }
}

export async function resolveCatalogReferenceValue(
  kind: ReferenceValueKind,
  rawName: string | null | undefined,
  options?: ReferenceWriteOptions
): Promise<string | null> {
  const trimmed = rawName?.trim()
  if (!trimmed) return null

  const parsed = findOrCreateReferenceValueSchema.safeParse({ kind, name: trimmed })
  if (!parsed.success) {
    throw new ReferenceValueNotInCatalogError(kind, trimmed)
  }

  const supabase = await resolveClient(options)
  const normalizedName = normalizeReferenceValueName(parsed.data.name)

  const { data: existing, error } = await supabase
    .from('reference_values')
    .select('name')
    .eq('kind', kind)
    .eq('normalized_name', normalizedName)
    .maybeSingle()

  if (error) throw error
  if (!existing) {
    throw new ReferenceValueNotInCatalogError(kind, parsed.data.name)
  }

  return existing.name as string
}

export async function findOrCreateReferenceValue(
  kind: ReferenceValueKind,
  rawName: string | null | undefined,
  options?: ReferenceWriteOptions
): Promise<string | null> {
  const trimmed = rawName?.trim()
  if (!trimmed) return null

  const parsed = findOrCreateReferenceValueSchema.safeParse({ kind, name: trimmed })
  if (!parsed.success) return trimmed.slice(0, 200)

  const supabase = await resolveClient(options)
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

export async function resolveEntryReferenceValues(
  input: {
    breed?: string | null
    colorMarking?: string | null
    bloodline?: string | null
  },
  resolution: CatalogResolutionOptions,
  options?: ReferenceWriteOptions
): Promise<{ breed: string | null; colorMarking: string | null; bloodline: string | null }> {
  const breedAllowCreate = resolution.mode === 'public' && resolution.allowBreedAdd
  const colorAllowCreate = resolution.mode === 'public' && resolution.allowColorAdd

  const [breed, colorMarking, bloodline] = await Promise.all([
    breedAllowCreate
      ? findOrCreateReferenceValue('breed', input.breed, options)
      : resolveCatalogReferenceValue('breed', input.breed, options),
    colorAllowCreate
      ? findOrCreateReferenceValue('color_marking', input.colorMarking, options)
      : resolveCatalogReferenceValue('color_marking', input.colorMarking, options),
    findOrCreateReferenceValue('bloodline', input.bloodline, options),
  ])

  return { breed, colorMarking, bloodline }
}

export async function createReferenceValue(
  kind: ReferenceValueKind,
  rawName: string,
  options?: ReferenceWriteOptions
): Promise<{ id: string; name: string }> {
  const trimmed = rawName.trim()
  const parsed = findOrCreateReferenceValueSchema.safeParse({ kind, name: trimmed })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid reference value')
  }

  const supabase = await resolveClient(options)
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
  },
  options?: ReferenceWriteOptions
): Promise<{
  breed: string | null
  bloodline: string | null
  colorMarking: string | null
}> {
  const [breed, bloodline, colorMarking] = await Promise.all([
    findOrCreateReferenceValue('breed', input.breed, options),
    findOrCreateReferenceValue('bloodline', input.bloodline, options),
    findOrCreateReferenceValue('color_marking', input.colorMarking, options),
  ])

  return { breed, bloodline, colorMarking }
}

export async function deleteReferenceValue(
  id: string,
  options?: ReferenceWriteOptions
): Promise<{ error?: string }> {
  const supabase = await resolveClient(options)

  const { data: row, error: fetchError } = await supabase
    .from('reference_values')
    .select('id, kind, name, normalized_name')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!row) return { error: 'Option not found' }

  const normalized = row.normalized_name as string

  if (row.kind === 'breed') {
    const { data: breedUsage, error: breedError } = await supabase
      .from('roosters')
      .select('id')
      .ilike('breed', row.name as string)
      .limit(1)

    if (breedError) return { error: breedError.message }
    if ((breedUsage ?? []).length > 0) {
      return { error: `Breed "${row.name}" is in use and cannot be deleted` }
    }
  }

  if (row.kind === 'color_marking') {
    const { data: colorUsage, error: colorError } = await supabase
      .from('rooster_event_registrations')
      .select('id')
      .ilike('color_marking', row.name as string)
      .limit(1)

    if (colorError) return { error: colorError.message }
    if ((colorUsage ?? []).length > 0) {
      return { error: `Color "${row.name}" is in use and cannot be deleted` }
    }
  }

  if (row.kind === 'bloodline') {
    const { data: bloodlineUsage, error: bloodlineError } = await supabase
      .from('roosters')
      .select('id')
      .ilike('bloodline', row.name as string)
      .limit(1)

    if (bloodlineError) return { error: bloodlineError.message }
    if ((bloodlineUsage ?? []).length > 0) {
      return { error: `Bloodline "${row.name}" is in use and cannot be deleted` }
    }
  }

  void normalized

  const { error: deleteError } = await supabase.from('reference_values').delete().eq('id', id)
  if (deleteError) return { error: deleteError.message }

  return {}
}
