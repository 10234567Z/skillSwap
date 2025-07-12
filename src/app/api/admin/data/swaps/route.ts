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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const swaps = await prisma.swapRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { name: true }
        },
        receiver: {
          select: { name: true }
        },
        rating: {
          select: { rating: true }
        }
      }
    })

    // Get skill names for each swap
    const swapsWithSkillNames = await Promise.all(
      swaps.map(async (swap) => {
        const [senderSkill, receiverSkill] = await Promise.all([
          prisma.userSkill.findUnique({
            where: { id: swap.senderSkillId },
            include: { skill: { select: { name: true } } }
          }),
          prisma.userSkill.findUnique({
            where: { id: swap.receiverSkillId },
            include: { skill: { select: { name: true } } }
          })
        ])

        return {
          ...swap,
          requesterName: swap.sender.name,
          recipientName: swap.receiver.name,
          skillOfferedName: senderSkill?.skill.name || 'Unknown Skill',
          skillWantedName: receiverSkill?.skill.name || 'Unknown Skill',
          rating: swap.rating?.rating || undefined
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: swapsWithSkillNames
    })

  } catch (error) {
    console.error('Error fetching swaps for admin:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch swaps' },
      { status: 500 }
    )
  }
}
