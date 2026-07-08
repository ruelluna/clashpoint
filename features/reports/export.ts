import type { CsvRow } from '@/features/reports/types'

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToCsv(rows: CsvRow[], columns?: string[]): string {
  if (rows.length === 0) {
    return columns?.map(escapeCsvCell).join(',') ?? ''
  }

  const headers = columns ?? Object.keys(rows[0])
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ]

  return lines.join('\r\n')
}

export function reportFilename(reportType: string, eventId?: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  const scope = eventId ? `${eventId.slice(0, 8)}-` : ''
  return `${scope}${reportType}-${stamp}.csv`
}
