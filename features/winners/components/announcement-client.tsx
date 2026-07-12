'use client'

import { Button, Text, Textarea } from '@chakra-ui/react'
import { useMemo, useState } from 'react'

import { PageStack, PanelCard } from '@/components/dashboard'

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
    <PageStack>
      <PanelCard title="Winner announcement">
        <Text fontSize="sm" color="fg.muted">
          {isFinalized
            ? 'Generated from finalized winners and prize payouts.'
            : 'Preview based on current standings. Finalize winners for the official announcement.'}
        </Text>
      </PanelCard>

      <Textarea value={text} readOnly rows={14} fontFamily="mono" fontSize="sm" />

      <Button onClick={copyToClipboard} variant="outline" alignSelf="flex-start">
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </Button>
    </PageStack>
  )
}
