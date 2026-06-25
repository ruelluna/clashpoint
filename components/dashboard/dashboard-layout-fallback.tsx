export function DashboardLayoutFallback() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside
        aria-hidden
        className="w-64 shrink-0 border-r border-border bg-muted/30"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          aria-hidden
          className="h-14 shrink-0 border-b border-border"
        />
        <main className="flex-1 p-6" />
      </div>
    </div>
  )
}
