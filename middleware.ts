import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || "coverstar-secret-key-123"
  
  // Try to get token with secureCookie: true since we forced it in route.ts
  const token = await getToken({ 
    req, 
    secret,
    secureCookie: true
  })
  
  const { pathname } = req.nextUrl
  
  if (pathname === '/' || pathname === '/gallery') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/gallery"],
};
