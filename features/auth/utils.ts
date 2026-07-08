export function safeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/dashboard'
  }

  return path
}

export const POST_BOOTSTRAP_REDIRECT = '/dashboard'
