import {
  STICKER_BARCODE_WIDTH_FRACTION,
  STICKER_HEIGHT_MM,
  STICKER_WIDTH_MM,
} from '@/features/printing/label-sizes'

const STICKER_BARCODE_MAX_WIDTH_PERCENT = STICKER_BARCODE_WIDTH_FRACTION * 100

const STICKER_PRINT_CSS = `
  @page {
    size: ${STICKER_WIDTH_MM}mm ${STICKER_HEIGHT_MM}mm;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    width: ${STICKER_WIDTH_MM}mm;
    height: ${STICKER_HEIGHT_MM}mm;
    overflow: hidden;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-slip-panel {
    width: ${STICKER_WIDTH_MM}mm;
    height: ${STICKER_HEIGHT_MM}mm;
    padding: 1.5mm 2mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .print-slip-header,
  .print-slip-only {
    display: none !important;
  }
  .print-sticker-only,
  .compact-barcode-label-body {
    display: flex !important;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 0.5mm;
  }
  .print-sticker-headline {
    font-size: 7pt;
    font-weight: bold;
    line-height: 1.1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  .print-sticker-code {
    font-size: 6pt;
    line-height: 1.1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  .barcode-label {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .barcode-label svg {
    max-width: ${STICKER_BARCODE_MAX_WIDTH_PERCENT}% !important;
    width: auto !important;
    height: auto;
    display: block;
  }
`

function waitForBarcodeSvgs(root: ParentNode): Promise<void> {
  return new Promise((resolve) => {
    let attempts = 0
    const maxAttempts = 60

    const tryReady = () => {
      attempts += 1
      const svgs = root.querySelectorAll('.barcode-label svg')
      const ready =
        svgs.length === 0 ||
        [...svgs].every((svg) => svg.childElementCount > 0)

      if (ready || attempts >= maxAttempts) {
        requestAnimationFrame(() => resolve())
        return
      }
      requestAnimationFrame(tryReady)
    }

    requestAnimationFrame(tryReady)
  })
}

export async function printCompactLabel(panel: HTMLElement): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute(
    'style',
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  )
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    throw new Error('Could not create print iframe')
  }

  doc.open()
  doc.write(
    `<!DOCTYPE html><html><head><title></title><style>${STICKER_PRINT_CSS}</style></head><body></body></html>`
  )
  doc.close()

  const clone = panel.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.no-print').forEach((el) => el.remove())
  doc.body.appendChild(clone)

  await waitForBarcodeSvgs(doc)

  return new Promise((resolve) => {
    const cleanup = () => {
      win.removeEventListener('afterprint', cleanup)
      iframe.remove()
      resolve()
    }

    win.addEventListener('afterprint', cleanup)
    win.focus()
    win.print()
  })
}

export function printWithClearedTitle(print: () => void): void {
  const previousTitle = document.title
  document.title = ' '
  try {
    print()
  } finally {
    window.setTimeout(() => {
      document.title = previousTitle
    }, 0)
  }
}
