import { ChakraClientRoot } from '@/components/chakra/client-root'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChakraClientRoot>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="text-sm font-semibold tracking-wide">
              ClashPoint
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/events" className="text-muted-foreground hover:text-foreground">
                Events
              </a>
              <a href="/portal" className="text-muted-foreground hover:text-foreground">
                Promoter portal
              </a>
              <a href="/login" className="text-muted-foreground hover:text-foreground">
                Sign in
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </ChakraClientRoot>
  )
}
