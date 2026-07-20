const APP_LOCALE = 'en-PH'
export const APP_TIME_ZONE = 'Asia/Manila'

const eventDateTimeOptions: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: APP_TIME_ZONE,
}

export function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString(APP_LOCALE, eventDateTimeOptions)
}

export function formatEventDateTimeNow(date = new Date()): string {
  return date.toLocaleString(APP_LOCALE, eventDateTimeOptions)
}
