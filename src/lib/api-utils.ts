import { NextResponse } from 'next/server'
import { ZodError, type ZodIssue } from 'zod'

export function handleError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      },
      { status: 400 }
    )
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function validateRequestMethod(request: Request, allowedMethods: string[]) {
  if (!allowedMethods.includes(request.method)) {
    throw new Error(`Method ${request.method} not allowed`)
  }
}

export async function getRequestBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new Error('Invalid JSON body')
  }
}
