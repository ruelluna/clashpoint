import { type NextRequest } from 'next/server'

import {
  createMiddlewareClient,
  redirectWithCookies,
} from '@/lib/supabase/middleware'

function isDashboardPath(pathname: string) {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

function isPortalPath(pathname: string) {
  return pathname === '/portal' || pathname.startsWith('/portal/')
}

export async function proxy(request: NextRequest) {
  const { supabase, response: supabaseResponse } =
    createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if ((isDashboardPath(pathname) || isPortalPath(pathname)) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return redirectWithCookies(loginUrl, supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login'],
}
