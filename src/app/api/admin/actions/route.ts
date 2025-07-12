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

// POST /api/admin/actions - Handle admin actions
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const { action, targetId, data } = await request.json()

    switch (action) {
      case 'ban_user': {
        // Delete user account completely
        await prisma.user.delete({
          where: { id: targetId }
        })
        
        return NextResponse.json({
          success: true,
          message: 'User account deleted successfully'
        })
      }

      case 'approve_skill': {
        await prisma.skill.update({
          where: { id: targetId },
          data: { isApproved: true }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Skill approved successfully'
        })
      }

      case 'reject_skill': {
        await prisma.skill.update({
          where: { id: targetId },
          data: { isApproved: false }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Skill rejected successfully'
        })
      }

      case 'send_global_message': {
        const { title, content } = data
        
        await prisma.adminMessage.create({
          data: {
            title,
            content,
            isGlobal: true
          }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Global message sent successfully'
        })
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Error performing admin action:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
