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

// GET /api/admin/data?type=users|skills|swaps
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    switch (type) {
      case 'users': {
        const [users, totalCount] = await Promise.all([
          prisma.user.findMany({
            where: { role: 'USER' },
            select: {
              id: true,
              name: true,
              email: true,
              location: true,
              createdAt: true,
              _count: {
                select: {
                  sentRequests: true,
                  receivedRequests: true
                }
              }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.user.count({ where: { role: 'USER' } })
        ])

        return NextResponse.json({
          success: true,
          data: { users, totalCount, totalPages: Math.ceil(totalCount / limit) }
        })
      }

      case 'skills': {
        const [skills, totalCount] = await Promise.all([
          prisma.skill.findMany({
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
              isApproved: true,
              createdAt: true,
              _count: {
                select: { userSkills: true }
              }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.skill.count()
        ])

        return NextResponse.json({
          success: true,
          data: { skills, totalCount, totalPages: Math.ceil(totalCount / limit) }
        })
      }

      case 'swaps': {
        const [swaps, totalCount] = await Promise.all([
          prisma.swapRequest.findMany({
            include: {
              sender: {
                select: { id: true, name: true, email: true }
              },
              receiver: {
                select: { id: true, name: true, email: true }
              }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.swapRequest.count()
        ])

        return NextResponse.json({
          success: true,
          data: { swaps, totalCount, totalPages: Math.ceil(totalCount / limit) }
        })
      }

      default: {
        return NextResponse.json(
          { success: false, error: 'Invalid data type' },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Error fetching admin data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
