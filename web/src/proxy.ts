import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/onboarding']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const needsAuth = PROTECTED.some(p => pathname.startsWith(p))
  if (!needsAuth) return NextResponse.next()

  const session = req.cookies.get('juno_session')?.value
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
}
