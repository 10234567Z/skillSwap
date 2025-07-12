import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { action } = await request.json()
    const { id: requestId } = await params

    if (!action || !['ACCEPTED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be ACCEPTED or REJECTED' },
        { status: 400 }
      )
    }

    // Find the request
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: requestId }
    })

    if (!swapRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if the current user is the receiver (only receiver can accept/reject)
    if (swapRequest.receiverId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only accept or reject requests sent to you' },
        { status: 403 }
      )
    }

    // Check if request is still pending
    if (swapRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Update the request status
    const updatedRequest = await prisma.swapRequest.update({
      where: { id: requestId },
      data: {
        status: action,
        updatedAt: new Date(),
        ...(action === 'ACCEPTED' ? { completedAt: new Date() } : {})
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        updatedAt: updatedRequest.updatedAt.toISOString(),
        completedAt: updatedRequest.completedAt?.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating swap request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
