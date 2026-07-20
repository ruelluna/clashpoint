import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  broadcastMatchingRefresh,
  resetMatchingCrossTabSyncForTests,
  subscribeMatchingCrossTabMessages,
  subscribeMatchingRefresh,
} from '@/features/matches/matching-cross-tab-sync'

function stubBrowserWindow() {
  let storageValue: string | null = null
  const storageListeners = new Set<(event: StorageEvent) => void>()

  vi.stubGlobal('window', {
    localStorage: {
      setItem: (_key: string, value: string) => {
        storageValue = value
      },
      getItem: () => storageValue,
    },
    setInterval: (handler: () => void) => {
      return setInterval(handler, 500)
    },
    clearInterval: (id: ReturnType<typeof setInterval>) => {
      clearInterval(id)
    },
    addEventListener: (eventName: string, listener: (event: StorageEvent) => void) => {
      if (eventName === 'storage') storageListeners.add(listener)
    },
    removeEventListener: (eventName: string, listener: (event: StorageEvent) => void) => {
      if (eventName === 'storage') storageListeners.delete(listener)
    },
  })

  return {
    emitStorage(value: string | null) {
      for (const listener of storageListeners) {
        listener({
          key: 'pitclash-matching-sync',
          newValue: value,
        } as StorageEvent)
      }
    },
    getStorageValue: () => storageValue,
  }
}

describe('matching-cross-tab-sync', () => {
  afterEach(() => {
    resetMatchingCrossTabSyncForTests()
    vi.unstubAllGlobals()
  })

  it('broadcasts refresh messages on the shared channel and storage', () => {
    const postMessage = vi.fn()
    stubBrowserWindow()

    vi.stubGlobal('BroadcastChannel', class {
      postMessage = postMessage
      close = vi.fn()
      onmessage: ((event: MessageEvent) => void) | null = null
    })

    broadcastMatchingRefresh('event-1', 'match-1', {
      action: 'palitada_added',
      fightNumber: 2,
    })

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        matchId: 'match-1',
        action: 'palitada_added',
        fightNumber: 2,
        sentAt: expect.any(Number),
      })
    )
  })

  it('delivers subscribed refresh messages from BroadcastChannel', () => {
    const handler = vi.fn()
    let channelListener: ((event: MessageEvent) => void) | undefined

    stubBrowserWindow()
    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(listenerFn: ((event: MessageEvent) => void) | undefined) {
        channelListener = listenerFn
      }
      postMessage = vi.fn()
      close = vi.fn()
    })

    subscribeMatchingRefresh(handler)
    channelListener?.({
      data: { eventId: 'event-1', matchId: 'match-2', sentAt: Date.now() },
    } as MessageEvent)

    expect(handler).toHaveBeenCalledWith({
      eventId: 'event-1',
      matchId: 'match-2',
    })
  })

  it('delivers subscribed refresh messages from storage events', () => {
    const handler = vi.fn()
    const browser = stubBrowserWindow()

    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(_listenerFn: ((event: MessageEvent) => void) | undefined) {}
      postMessage = vi.fn()
      close = vi.fn()
    })

    subscribeMatchingRefresh(handler)
    browser.emitStorage(
      JSON.stringify({
        eventId: 'event-1',
        matchId: 'match-3',
        action: 'palitada_removed',
        contributionId: 'contrib-1',
        sentAt: Date.now(),
      })
    )

    expect(handler).toHaveBeenCalledWith({
      eventId: 'event-1',
      matchId: 'match-3',
      action: 'palitada_removed',
      contributionId: 'contrib-1',
    })
  })

  it('filters cross-tab messages by event id', () => {
    const handler = vi.fn()
    const browser = stubBrowserWindow()

    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(_listenerFn: ((event: MessageEvent) => void) | undefined) {}
      postMessage = vi.fn()
      close = vi.fn()
    })

    subscribeMatchingCrossTabMessages({
      eventId: 'event-a',
      pollOnMount: false,
      onMessage: handler,
    })

    browser.emitStorage(
      JSON.stringify({
        eventId: 'event-b',
        matchId: 'match-1',
        sentAt: Date.now(),
      })
    )

    expect(handler).not.toHaveBeenCalled()
  })

  it('deduplicates cross-tab messages by sentAt', () => {
    const handler = vi.fn()
    const browser = stubBrowserWindow()

    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(_listenerFn: ((event: MessageEvent) => void) | undefined) {}
      postMessage = vi.fn()
      close = vi.fn()
    })

    subscribeMatchingCrossTabMessages({
      eventId: 'event-1',
      pollOnMount: false,
      onMessage: handler,
    })

    const payload = JSON.stringify({
      eventId: 'event-1',
      matchId: 'match-1',
      action: 'palitada_added',
      sentAt: 1_700_000_000_000,
    })

    browser.emitStorage(payload)
    browser.emitStorage(payload)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('replays stored messages after listener remount', () => {
    const handler = vi.fn()
    const browser = stubBrowserWindow()

    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(_listenerFn: ((event: MessageEvent) => void) | undefined) {}
      postMessage = vi.fn()
      close = vi.fn()
    })

    browser.getStorageValue()
    window.localStorage.setItem(
      'pitclash-matching-sync',
      JSON.stringify({
        eventId: 'event-1',
        matchId: 'match-9',
        action: 'palitada_added',
        sentAt: 1_700_000_000_111,
      })
    )

    const unsubscribe = subscribeMatchingCrossTabMessages({
      eventId: 'event-1',
      pollOnMount: true,
      onMessage: handler,
    })

    expect(handler).toHaveBeenCalledTimes(1)
    unsubscribe()

    subscribeMatchingCrossTabMessages({
      eventId: 'event-1',
      pollOnMount: true,
      onMessage: handler,
    })

    expect(handler).toHaveBeenCalledTimes(2)
  })
})
