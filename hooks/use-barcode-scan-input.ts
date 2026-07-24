'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'

import {
  markBarcodeScanCaptureFocused,
  registerBarcodeScanCapture,
} from '@/hooks/barcode-scan-capture'
import {
  normalizeScanInput,
  resolveScanValueFromInput,
  shouldIdleSubmitBarcode,
  type ScanSubmitOutcome,
} from '@/features/entries/barcode-scan-utils'

export type UseBarcodeScanInputOptions = {
  onSubmit: (value: string) => Promise<ScanSubmitOutcome> | ScanSubmitOutcome
  autoFocus?: boolean
  globalCapture?: boolean
  idleSubmitMs?: number
  minBarcodeLength?: number
  disabled?: boolean
}

export function useBarcodeScanInput({
  onSubmit,
  autoFocus = true,
  globalCapture = true,
  idleSubmitMs = 120,
  minBarcodeLength = 8,
  disabled = false,
}: UseBarcodeScanInputOptions) {
  const captureId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const idleTimerRef = useRef<number | null>(null)
  const pendingRef = useRef(false)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const submitValue = useCallback(
    async (raw: string) => {
      const trimmed = resolveScanValueFromInput(raw)
      if (!trimmed || pendingRef.current || disabled) return

      pendingRef.current = true
      setPending(true)

      const outcome = await onSubmit(trimmed)

      pendingRef.current = false
      setPending(false)

      if (outcome === 'success') {
        setValue('')
        inputRef.current?.focus()
        return
      }

      inputRef.current?.select()
    },
    [disabled, onSubmit]
  )

  useEffect(() => {
    if (!autoFocus || disabled) return
    inputRef.current?.focus()
  }, [autoFocus, disabled])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.dataset.barcodeScanInput = 'true'
  })

  useEffect(() => {
    if (!globalCapture || disabled) return

    return registerBarcodeScanCapture({
      id: captureId,
      inputRef,
      setBuffer: setValue,
      submitBuffer: (raw) => {
        void submitValue(raw)
      },
      isActive: () => !disabled && !pendingRef.current,
      markFocused: () => markBarcodeScanCaptureFocused(captureId),
      idleSubmitMs,
      minBarcodeLength,
    })
  }, [
    captureId,
    disabled,
    globalCapture,
    idleSubmitMs,
    minBarcodeLength,
    submitValue,
  ])

  useEffect(() => {
    return () => clearIdleTimer()
  }, [clearIdleTimer])

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value
      setValue(next)
      clearIdleTimer()

      if (disabled || pendingRef.current) return

      if (shouldIdleSubmitBarcode(next, minBarcodeLength)) {
        idleTimerRef.current = window.setTimeout(() => {
          void submitValue(next)
        }, idleSubmitMs)
      }
    },
    [clearIdleTimer, disabled, idleSubmitMs, minBarcodeLength, submitValue]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      clearIdleTimer()
      void submitValue(event.currentTarget.value)
    },
    [clearIdleTimer, submitValue]
  )

  const onFocus = useCallback(() => {
    markBarcodeScanCaptureFocused(captureId)
  }, [captureId])

  const submitCurrent = useCallback(() => {
    void submitValue(value)
  }, [submitValue, value])

  const submitRaw = useCallback(
    (raw: string) => {
      void submitValue(raw)
    },
    [submitValue]
  )

  const clear = useCallback(() => {
    setValue('')
  }, [])

  const setScanValue = useCallback((next: string) => {
    setValue(normalizeScanInput(next))
  }, [])

  return {
    inputRef,
    value,
    setValue: setScanValue,
    clear,
    onChange,
    onKeyDown,
    onFocus,
    submitCurrent,
    submitRaw,
    pending,
  }
}
