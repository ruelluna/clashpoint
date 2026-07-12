'use client'

import { useServerInsertedHTML } from 'next/navigation'

import { colorModeBootstrapScript } from '@/components/ui/color-mode-script'

export function ColorModeBootstrap() {
  useServerInsertedHTML(() => (
    <script
      id="color-mode-bootstrap"
      dangerouslySetInnerHTML={{ __html: colorModeBootstrapScript }}
    />
  ))

  return null
}
