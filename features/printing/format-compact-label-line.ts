const DEFAULT_MAX_LENGTH = 28

export function truncateCompactLabelLine(
  text: string,
  maxLength = DEFAULT_MAX_LENGTH
): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 1)}…`
}

export function formatOwnerStickerHeadline(entryNumber: string, ownerName: string): string {
  return truncateCompactLabelLine(`OWN · #${entryNumber} · ${ownerName}`)
}

/** Band number only — fits 50×30 mm cock stickers without truncating the scan code area. */
export function formatCockStickerHeadline(bandNumber: string): string {
  return truncateCompactLabelLine(bandNumber.trim(), 18)
}

export function formatPledgeStickerHeadline(
  fightNumber: number,
  sideLabel: string,
  amountLabel: string
): string {
  return truncateCompactLabelLine(`F${fightNumber} · ${sideLabel} · ${amountLabel}`)
}
