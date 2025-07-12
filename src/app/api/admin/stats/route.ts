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

// GET /api/admin/stats - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    // Get basic statistics
    const [
      totalUsers,
      totalSwaps,
      completedSwaps,
      pendingSwaps,
      totalSkills,
      pendingSkills,
      activeUsers
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.swapRequest.count(),
      prisma.swapRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.swapRequest.count({ where: { status: 'PENDING' } }),
      prisma.skill.count(),
      prisma.skill.count({ where: { isApproved: false } }),
      prisma.user.count({
        where: {
          role: 'USER',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalSwaps,
        completedSwaps,
        pendingSwaps,
        totalSkills,
        pendingSkills
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
