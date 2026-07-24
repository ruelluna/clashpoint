import type { RefObject } from 'react'

import { shouldIdleSubmitBarcode } from '@/features/entries/barcode-scan-utils'

export type BarcodeScanCaptureRegistration = {
  id: string
  inputRef: RefObject<HTMLInputElement | null>
  setBuffer: (value: string) => void
  submitBuffer: (raw: string) => void
  isActive: () => boolean
  markFocused: () => void
  idleSubmitMs: number
  minBarcodeLength: number
}

const registrations: BarcodeScanCaptureRegistration[] = []
let lastFocusedId: string | null = null
let globalBuffer = ''
let globalIdleTimer: number | null = null
let listenerAttached = false

export function isEditableElement(element: Element | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  if (element.isContentEditable) return true
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true
  }
  if (element instanceof HTMLInputElement) {
    const type = element.type
    if (
      type === 'button' ||
      type === 'submit' ||
      type === 'reset' ||
      type === 'checkbox' ||
      type === 'radio' ||
      type === 'hidden' ||
      type === 'file'
    ) {
      return false
    }
    return true
  }
  return false
}

export function isBarcodeScanInput(element: Element | null): boolean {
  return element instanceof HTMLElement && element.dataset.barcodeScanInput === 'true'
}

function clearGlobalIdleTimer() {
  if (globalIdleTimer != null) {
    window.clearTimeout(globalIdleTimer)
    globalIdleTimer = null
  }
}

function getTargetRegistration(): BarcodeScanCaptureRegistration | null {
  const active = registrations.filter((registration) => registration.isActive())
  if (active.length === 0) return null

  if (lastFocusedId) {
    const lastFocused = active.find((registration) => registration.id === lastFocusedId)
    if (lastFocused) return lastFocused
  }

  for (const registration of active) {
    if (registration.inputRef.current === document.activeElement) {
      return registration
    }
  }

  return active[0] ?? null
}

function scheduleGlobalIdleSubmit(registration: BarcodeScanCaptureRegistration) {
  clearGlobalIdleTimer()
  if (!shouldIdleSubmitBarcode(globalBuffer, registration.minBarcodeLength)) return

  globalIdleTimer = window.setTimeout(() => {
    globalIdleTimer = null
    const value = globalBuffer
    globalBuffer = ''
    registration.setBuffer(value)
    registration.submitBuffer(value)
  }, registration.idleSubmitMs)
}

function handleGlobalKeyDown(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target : null

  if (isEditableElement(target) && !isBarcodeScanInput(target)) {
    globalBuffer = ''
    clearGlobalIdleTimer()
    return
  }

  if (isBarcodeScanInput(target)) {
    globalBuffer = ''
    clearGlobalIdleTimer()
    return
  }

  const registration = getTargetRegistration()
  if (!registration) return

  if (event.key === 'Enter') {
    if (!globalBuffer.trim()) return
    event.preventDefault()
    clearGlobalIdleTimer()
    const value = globalBuffer
    globalBuffer = ''
    registration.setBuffer(value)
    registration.submitBuffer(value)
    return
  }

  if (event.key === 'Backspace') {
    if (!globalBuffer) return
    event.preventDefault()
    globalBuffer = globalBuffer.slice(0, -1)
    registration.setBuffer(globalBuffer)
    scheduleGlobalIdleSubmit(registration)
    return
  }

  if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return

  event.preventDefault()
  globalBuffer += event.key
  registration.setBuffer(globalBuffer)
  scheduleGlobalIdleSubmit(registration)
}

function attachListenerIfNeeded() {
  if (listenerAttached) return
  document.addEventListener('keydown', handleGlobalKeyDown, true)
  listenerAttached = true
}

function detachListenerIfEmpty() {
  if (registrations.length > 0 || !listenerAttached) return
  document.removeEventListener('keydown', handleGlobalKeyDown, true)
  listenerAttached = false
  globalBuffer = ''
  clearGlobalIdleTimer()
}

export function registerBarcodeScanCapture(
  registration: BarcodeScanCaptureRegistration
): () => void {
  registrations.push(registration)
  attachListenerIfNeeded()

  return () => {
    const index = registrations.findIndex((entry) => entry.id === registration.id)
    if (index >= 0) registrations.splice(index, 1)
    if (lastFocusedId === registration.id) lastFocusedId = null
    detachListenerIfEmpty()
  }
}

export function markBarcodeScanCaptureFocused(id: string) {
  lastFocusedId = id
}

export function resetBarcodeScanCaptureForTests() {
  registrations.splice(0, registrations.length)
  lastFocusedId = null
  globalBuffer = ''
  clearGlobalIdleTimer()
  if (listenerAttached) {
    document.removeEventListener('keydown', handleGlobalKeyDown, true)
    listenerAttached = false
  }
}
