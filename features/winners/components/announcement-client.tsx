'use client'

import { Box, Button, Text, Textarea } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

type AnnouncementClientProps = {
  announcementText: string
  isFinalized: boolean
}

export function AnnouncementClient({
  announcementText,
  isFinalized,
}: AnnouncementClientProps) {
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => announcementText, [announcementText])

  async function copyToClipboard() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box className="space-y-4">
      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
        <Text fontWeight="medium">Winner announcement</Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          {isFinalized
            ? 'Generated from finalized winners and prize payouts.'
            : 'Preview based on current standings. Finalize winners for the official announcement.'}
        </Text>
      </Box>

      <Textarea value={text} readOnly rows={14} fontFamily="mono" fontSize="sm" />

      <Button onClick={copyToClipboard} variant="outline">
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </Button>
    </Box>
  )
}
