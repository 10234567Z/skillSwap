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

    const { skillId, approved } = await request.json()

    if (!skillId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Skill ID and approval status are required' },
        { status: 400 }
      )
    }

    if (approved) {
      // Approve the skill
      await prisma.skill.update({
        where: { id: skillId },
        data: { isApproved: true }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Skill approved successfully'
      })
    } else {
      // Reject (delete) the skill
      await prisma.skill.delete({
        where: { id: skillId }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Skill rejected and removed'
      })
    }

  } catch (error) {
    console.error('Error processing skill approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process skill approval' },
      { status: 500 }
    )
  }
}
