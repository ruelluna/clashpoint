const MATCHING_SYNC_CHANNEL = 'pitclash-matching-sync'
export const MATCHING_SYNC_STORAGE_KEY = 'pitclash-matching-sync'
export const MATCHING_SYNC_HANDLED_STORAGE_KEY = 'pitclash-matching-sync-handled'
const POLL_MS = 500

export type CrossTabSource = 'broadcast' | 'storage' | 'poll'

export type PalitadaSyncAction = 'palitada_added' | 'palitada_removed'

export type SettlementSyncAction = 'settlement_updated'

export type MatchingSyncAction = PalitadaSyncAction | SettlementSyncAction

export type MatchingSyncMessage = {
  eventId: string
  matchId: string
  action?: MatchingSyncAction
  fightNumber?: number
  contributionId?: string
  sentAt?: number
}

type StoredMatchingSyncMessage = MatchingSyncMessage & { sentAt: number }

type CrossTabListener = {
  eventId: string | null
  lastHandledSentAt: number
  pollOnMount: boolean
  onMessage: (message: MatchingSyncMessage, source: CrossTabSource) => void
}

const listeners = new Set<CrossTabListener>()
let broadcastChannel: BroadcastChannel | null = null
let globalListenersInstalled = false
let pollTimer: number | null = null

function isMatchingSyncMessage(value: unknown): value is MatchingSyncMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<MatchingSyncMessage>
  return typeof record.eventId === 'string' && typeof record.matchId === 'string'
}

function parseStoredMessage(raw: string | null): StoredMatchingSyncMessage | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMatchingSyncMessage>
    if (!isMatchingSyncMessage(parsed) || typeof parsed.sentAt !== 'number') {
      return null
    }
    return parsed as StoredMatchingSyncMessage
  } catch {
    return null
  }
}

function getBrowserWindow(): Window | undefined {
  if (typeof globalThis === 'undefined') return undefined
  return globalThis.window
}

function readLatestStoredMessage(): StoredMatchingSyncMessage | null {
  const win = getBrowserWindow()
  if (!win) return null
  try {
    return parseStoredMessage(win.localStorage.getItem(MATCHING_SYNC_STORAGE_KEY))
  } catch {
    return null
  }
}

function resolveSentAt(message: MatchingSyncMessage): number | null {
  if (typeof message.sentAt === 'number') return message.sentAt
  const stored = readLatestStoredMessage()
  if (
    stored &&
    stored.eventId === message.eventId &&
    stored.matchId === message.matchId
  ) {
    return stored.sentAt
  }
  return null
}

function stripSentAt(message: MatchingSyncMessage): MatchingSyncMessage {
  const { sentAt: _sentAt, ...rest } = message
  return rest
}

function listenerMatchesEvent(listener: CrossTabListener, eventId: string): boolean {
  return listener.eventId == null || listener.eventId === eventId
}

function readPersistedLastHandledSentAt(eventId: string): number {
  const win = getBrowserWindow()
  if (!win) return 0
  try {
    const raw = win.sessionStorage.getItem(MATCHING_SYNC_HANDLED_STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as Record<string, number>
    const value = parsed[eventId]
    return typeof value === 'number' ? value : 0
  } catch {
    return 0
  }
}

function persistLastHandledSentAt(eventId: string, sentAt: number) {
  const win = getBrowserWindow()
  if (!win) return
  try {
    const raw = win.sessionStorage.getItem(MATCHING_SYNC_HANDLED_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    const current = parsed[eventId] ?? 0
    if (sentAt <= current) return
    parsed[eventId] = sentAt
    win.sessionStorage.setItem(MATCHING_SYNC_HANDLED_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // ignore storage errors
  }
}

function deliverToListeners(message: MatchingSyncMessage, source: CrossTabSource) {
  const sentAt = resolveSentAt(message)
  if (sentAt == null) return

  for (const listener of listeners) {
    if (!listenerMatchesEvent(listener, message.eventId)) continue
    if (sentAt <= listener.lastHandledSentAt) continue

    listener.lastHandledSentAt = sentAt
    persistLastHandledSentAt(message.eventId, sentAt)
    listener.onMessage(stripSentAt(message), source)
  }
}

function deliverStoredMessage(stored: StoredMatchingSyncMessage, source: CrossTabSource) {
  deliverToListeners(stored, source)
}

function ensureBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined' || broadcastChannel) return

  broadcastChannel = new BroadcastChannel(MATCHING_SYNC_CHANNEL)
  broadcastChannel.onmessage = (event: MessageEvent<MatchingSyncMessage>) => {
    if (!isMatchingSyncMessage(event.data)) return
    deliverToListeners(event.data, 'broadcast')
  }
}

function readStorageForAllListeners(source: CrossTabSource) {
  const stored = readLatestStoredMessage()
  if (stored) deliverStoredMessage(stored, source)
}

function ensureGlobalListeners() {
  const win = getBrowserWindow()
  if (!win || globalListenersInstalled) return

  const onStorage = (event: StorageEvent) => {
    if (event.key !== MATCHING_SYNC_STORAGE_KEY) return
    const stored = parseStoredMessage(event.newValue)
    if (stored) deliverStoredMessage(stored, 'storage')
  }

  const onVisible = () => {
    if (typeof document !== 'undefined' && document.hidden) return
    readStorageForAllListeners('poll')
  }

  win.addEventListener('storage', onStorage)
  win.addEventListener('focus', onVisible)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible)
  }

  pollTimer = win.setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    readStorageForAllListeners('poll')
  }, POLL_MS)

  globalListenersInstalled = true
}

function publishSyncMessage(message: MatchingSyncMessage) {
  const win = getBrowserWindow()
  if (!win) return

  const sentAt = Date.now()
  const stored: StoredMatchingSyncMessage = { ...message, sentAt }
  const payload: MatchingSyncMessage = { ...message, sentAt }

  try {
    win.localStorage.setItem(MATCHING_SYNC_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // ignore storage errors (private mode, quota)
  }

  ensureBroadcastChannel()
  broadcastChannel?.postMessage(payload)
  deliverToListeners(payload, 'broadcast')
}

export function peekLatestMatchingSyncMessage(): StoredMatchingSyncMessage | null {
  return readLatestStoredMessage()
}

export function subscribeMatchingCrossTabMessages(options: {
  eventId: string
  onMessage: (message: MatchingSyncMessage, source: CrossTabSource) => void
  pollOnMount?: boolean
}): () => void {
  const win = getBrowserWindow()
  if (!win) return () => undefined

  const listener: CrossTabListener = {
    eventId: options.eventId,
    lastHandledSentAt: readPersistedLastHandledSentAt(options.eventId),
    pollOnMount: options.pollOnMount ?? false,
    onMessage: options.onMessage,
  }

  listeners.add(listener)
  ensureBroadcastChannel()
  ensureGlobalListeners()

  if (listener.pollOnMount) {
    readStorageForAllListeners('poll')
  }

  return () => {
    listeners.delete(listener)
  }
}

export function broadcastMatchingRefresh(
  eventId: string,
  matchId: string,
  options?: {
    action?: MatchingSyncAction
    fightNumber?: number
    contributionId?: string
  }
) {
  publishSyncMessage({
    eventId,
    matchId,
    action: options?.action,
    fightNumber: options?.fightNumber,
    contributionId: options?.contributionId,
  })
}

export function broadcastSettlementUpdated(eventId: string, matchId: string) {
  broadcastMatchingRefresh(eventId, matchId, { action: 'settlement_updated' })
}

/** @deprecated Prefer subscribeMatchingCrossTabMessages */
export function subscribeMatchingRefresh(
  handler: (message: MatchingSyncMessage) => void
): () => void {
  const win = getBrowserWindow()
  if (!win) return () => undefined

  const listener: CrossTabListener = {
    eventId: null,
    lastHandledSentAt: 0,
    pollOnMount: true,
    onMessage: (message) => handler(message),
  }

  listeners.add(listener)
  ensureBroadcastChannel()
  ensureGlobalListeners()
  readStorageForAllListeners('poll')

  return () => {
    listeners.delete(listener)
  }
}

/** @internal Test helper */
export function resetMatchingCrossTabSyncForTests() {
  listeners.clear()

  const win = getBrowserWindow()
  if (pollTimer && win) {
    win.clearInterval(pollTimer)
  }
  pollTimer = null
  globalListenersInstalled = false

  broadcastChannel?.close()
  broadcastChannel = null
}
