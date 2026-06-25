export function safeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/dashboard'
  }

  return path
}
