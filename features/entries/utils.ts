export function normalizeEntryIdentity(
    name: string | null | undefined
): string | null {
    if (name == null) return null
    const collapsed = name.trim().replace(/\s+/g, ' ')
    if (!collapsed) return null
    return collapsed.toLowerCase()
}

export function isSameOwnerIdentity(ownerA: string, ownerB: string): boolean {
    return normalizeEntryIdentity(ownerA) === normalizeEntryIdentity(ownerB)
}

export function isDuplicateOwnerForEvent(
    ownerName: string,
    competitorId: string | null | undefined,
    existing: {
        id: string
        owner_name: string
        competitor_id: string | null
    },
    excludeEntryId?: string
): boolean {
    if (excludeEntryId && existing.id === excludeEntryId) return false
    if (competitorId && existing.competitor_id === competitorId) return true
    return isSameOwnerIdentity(ownerName, existing.owner_name)
}

export const DUPLICATE_ENTRY_ERROR =
    'This owner is already registered for this event.'
