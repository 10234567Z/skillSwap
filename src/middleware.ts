import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export function middleware(request: NextRequest) {
  // Check if the request is for API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip auth check for login and register endpoints
    const publicEndpoints = ['/api/auth/login', '/api/auth/register']
    
    if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
      return NextResponse.next()
    }
    
    // Check for authentication
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-role', user.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}
