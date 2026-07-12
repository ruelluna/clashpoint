export function normalizeEntryIdentity(
  name: string | null | undefined
): string | null {
  if (name == null) return null
  const collapsed = name.trim().replace(/\s+/g, ' ')
  if (!collapsed) return null
  return collapsed.toLowerCase()
}

export function isSameEntryIdentity(
  ownerA: string,
  handlerA: string | null | undefined,
  ownerB: string,
  handlerB: string | null | undefined
): boolean {
  return (
    normalizeEntryIdentity(ownerA) === normalizeEntryIdentity(ownerB) &&
    normalizeEntryIdentity(handlerA) === normalizeEntryIdentity(handlerB)
  )
}

export const DUPLICATE_ENTRY_ERROR =
  'An entry for this owner and handler is already registered for this event.'
