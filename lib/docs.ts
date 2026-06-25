export function getAdminDocsUrl(): string | undefined {
  const url = process.env.ADMIN_DOCS_URL?.trim()
  return url || undefined
}

export function getUserDocsUrl(): string | undefined {
  const url = process.env.USER_DOCS_URL?.trim()
  return url || undefined
}
