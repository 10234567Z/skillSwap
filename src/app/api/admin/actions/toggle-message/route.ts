import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Admin middleware check
async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { success: false, error: 'Authentication required', status: 401 }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { success: false, error: 'Invalid token', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required', status: 403 }
  }

  return { success: true, userId: payload.userId }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const { messageId, isActive } = await request.json()

    if (!messageId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Message ID and active status are required' },
        { status: 400 }
      )
    }

    const message = await prisma.adminMessage.update({
      where: { id: messageId },
      data: { isActive }
    })
    
    return NextResponse.json({
      success: true,
      data: message,
      message: `Message ${isActive ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('Error toggling message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle message' },
      { status: 500 }
    )
  }
}
