import { toaster } from '@/components/ui/toaster'

export type PalitadaSyncToastInput = {
  type: 'success' | 'info'
  title: string
  description: string
}

let pendingToast: PalitadaSyncToastInput | null = null
let flushListenersAttached = false

function runAfterMount(task: () => void) {
  window.setTimeout(task, 0)
}

function showPalitadaSyncToastNow(input: PalitadaSyncToastInput) {
  runAfterMount(() => {
    toaster.create({
      type: input.type,
      title: input.title,
      description: input.description,
      duration: 5000,
      closable: true,
    })
  })
}

function flushPendingToast() {
  if (typeof document === 'undefined' || document.hidden || !pendingToast) return
  showPalitadaSyncToastNow(pendingToast)
  pendingToast = null
}

function attachFlushListeners() {
  if (flushListenersAttached || typeof window === 'undefined') return
  flushListenersAttached = true

  document.addEventListener('visibilitychange', flushPendingToast)
  window.addEventListener('focus', flushPendingToast)
}

export function showPalitadaSyncToast(input: PalitadaSyncToastInput) {
  attachFlushListeners()

  const documentHidden = typeof document !== 'undefined' ? document.hidden : false

  if (documentHidden) {
    pendingToast = input
    return
  }

  showPalitadaSyncToastNow(input)
}

export function showPalitadaRecordedToast(fightLabel: string) {
  showPalitadaSyncToast({
    type: 'success',
    title: 'Palitada recorded',
    description: `${fightLabel} bet balancing was updated.`,
  })
}

export function showPalitadaRemovedToast(fightLabel: string) {
  showPalitadaSyncToast({
    type: 'info',
    title: 'Palitada removed',
    description: `${fightLabel} bet balancing was updated.`,
  })
}
