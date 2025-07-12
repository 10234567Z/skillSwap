import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export function middleware(request: NextRequest) {
  // Check if the request is for API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Fully public endpoints that don't require authentication
    const publicEndpoints = [
      '/api/auth/login', 
      '/api/auth/register'
    ]
    
    // Endpoints that are public but can use optional authentication
    const optionalAuthEndpoints = [
      '/api/users'
    ]
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    )
    
    const isOptionalAuthEndpoint = optionalAuthEndpoints.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    )
    
    if (isPublicEndpoint) {
      return NextResponse.next()
    }
    
    // For optional auth endpoints and protected endpoints, try to get user
    const user = getUserFromRequest(request)
    
    if (isOptionalAuthEndpoint) {
      // For optional auth endpoints, add user headers if user exists
      if (user) {
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
      // No user but that's okay for optional auth endpoints
      return NextResponse.next()
    }
    
    // For protected endpoints, require authentication
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Add user info to headers for protected API routes
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
