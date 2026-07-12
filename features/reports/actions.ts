'use server'

import { exportToCsv, reportFilename } from '@/features/reports/export'
import {
  getAuditReport,
  getEventSummaryReport,
  getMatchReport,
  getPromoterReport,
  getRegistrationReport,
  getResultReport,
  getWeighingReport,
} from '@/features/reports/queries'
import type { CsvRow, EventReportType, GlobalReportType } from '@/features/reports/types'
import { requirePermission } from '@/lib/auth/permissions'

export type DownloadReportState = {
  csv?: string
  filename?: string
  error?: string
}

async function fetchReportRows(
  reportType: EventReportType | GlobalReportType,
  eventId?: string
): Promise<CsvRow[]> {
  switch (reportType) {
    case 'event_summary':
      if (!eventId) throw new Error('Event ID required')
      return getEventSummaryReport(eventId)
    case 'registration':
      if (!eventId) throw new Error('Event ID required')
      return getRegistrationReport(eventId)
    case 'weighing':
      if (!eventId) throw new Error('Event ID required')
      return getWeighingReport(eventId)
    case 'match':
      if (!eventId) throw new Error('Event ID required')
      return getMatchReport(eventId)
    case 'result':
      if (!eventId) throw new Error('Event ID required')
      return getResultReport(eventId)
    case 'audit':
      return getAuditReport(eventId ? { eventId, limit: 500 } : { limit: 500 })
    case 'promoter':
      return getPromoterReport()
    default:
      throw new Error('Unknown report type')
  }
}

export async function downloadReportCsvAction(
  reportType: EventReportType | GlobalReportType,
  eventId?: string
): Promise<DownloadReportState> {
  await requirePermission('reports.view')

  try {
    const rows = await fetchReportRows(reportType, eventId)
    const csv = exportToCsv(rows)
    const filename = reportFilename(reportType, eventId)

    return { csv, filename }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to generate report',
    }
  }
}
