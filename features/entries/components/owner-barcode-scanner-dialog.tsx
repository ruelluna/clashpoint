'use client'

import {
  Button,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LAYOUT_GAP } from '@/components/dashboard'

type OwnerBarcodeScannerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
}

export function OwnerBarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
}: OwnerBarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }, [])

  useEffect(() => {
    if (!open) {
      stopScanner()
      setError(null)
      setStarting(false)
      return
    }

    let cancelled = false

    async function startScanner() {
      setStarting(true)
      setError(null)

      try {
        const reader = new BrowserMultiFormatReader()

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
        const preferredDevice =
          videoInputDevices.find((device) =>
            /back|rear|environment/i.test(device.label)
          ) ?? videoInputDevices[0]

        if (!preferredDevice) {
          if (!cancelled) {
            setError('No camera found on this device.')
          }
          return
        }

        const controls = await reader.decodeFromVideoDevice(
          preferredDevice.deviceId,
          videoRef.current!,
          (result, scanError) => {
            if (cancelled || !result) return
            if (scanError && scanError.name === 'NotFoundException') return

            const value = result.getText().trim()
            if (!value) return

            stopScanner()
            onScan(value)
            onOpenChange(false)
          }
        )
        controlsRef.current = controls
      } catch (scanError) {
        if (!cancelled) {
          const message =
            scanError instanceof Error
              ? scanError.message
              : 'Camera access was denied or is unavailable.'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setStarting(false)
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      stopScanner()
    }
  }, [onOpenChange, onScan, open, stopScanner])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open)
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <Dialog.Title>Scan owner barcode</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={LAYOUT_GAP.form}>
                <Flex
                  borderWidth="1px"
                  borderColor="border"
                  rounded="md"
                  overflow="hidden"
                  bg="black"
                  minH="240px"
                  align="center"
                  justify="center"
                >
                  <video
                    ref={videoRef}
                    style={{ width: '100%', maxHeight: '320px' }}
                    muted
                    playsInline
                  />
                </Flex>
                {starting ? (
                  <Text fontSize="sm" color="fg.muted">
                    Starting camera…
                  </Text>
                ) : null}
                {error ? (
                  <Text fontSize="sm" color="red.500">
                    {error}
                  </Text>
                ) : (
                  <Text fontSize="sm" color="fg.muted">
                    Point the camera at the OWNER slip barcode. Scanning stops after a
                    successful read.
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" type="button">
                  Close
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
