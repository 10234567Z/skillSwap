import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SwapRequestWithDetails, PaginationInfo } from '@/types'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    // Filter by direction (sent/received)
    if (direction === 'sent') {
      where.senderId = payload.userId
    } else if (direction === 'received') {
      where.receiverId = payload.userId
    } else {
      // All requests (both sent and received)
      where.OR = [
        { senderId: payload.userId },
        { receiverId: payload.userId }
      ]
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status
    }

    // Get total count for pagination
    const totalCount = await prisma.swapRequest.count({ where })
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    // Fetch requests with user and skill details
    const requests = await prisma.swapRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            location: true,
            profilePhoto: true,
            receivedRatings: {
              select: {
                rating: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            location: true,
            profilePhoto: true,
            receivedRatings: {
              select: {
                rating: true
              }
            }
          }
        },
        rating: true
      }
    })

    // Get skill details separately (since we need to join with UserSkill and Skill tables)
    const requestsWithSkills = await Promise.all(
      requests.map(async (request) => {
        // Get sender skill details
        const senderUserSkill = await prisma.userSkill.findFirst({
          where: {
            id: request.senderSkillId
          },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        })

        // Get receiver skill details
        const receiverUserSkill = await prisma.userSkill.findFirst({
          where: {
            id: request.receiverSkillId
          },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        })

        // Calculate average ratings
        const senderRatings = request.sender.receivedRatings
        const receiverRatings = request.receiver.receivedRatings
        
        const senderAvgRating = senderRatings.length > 0
          ? senderRatings.reduce((sum, r) => sum + r.rating, 0) / senderRatings.length
          : 0
          
        const receiverAvgRating = receiverRatings.length > 0
          ? receiverRatings.reduce((sum, r) => sum + r.rating, 0) / receiverRatings.length
          : 0

        return {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          senderSkillId: request.senderSkillId,
          receiverSkillId: request.receiverSkillId,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
          completedAt: request.completedAt?.toISOString(),
          sender: {
            id: request.sender.id,
            name: request.sender.name,
            location: request.sender.location,
            profilePhoto: request.sender.profilePhoto,
            averageRating: Math.round(senderAvgRating * 10) / 10,
            totalRatings: senderRatings.length
          },
          receiver: {
            id: request.receiver.id,
            name: request.receiver.name,
            location: request.receiver.location,
            profilePhoto: request.receiver.profilePhoto,
            averageRating: Math.round(receiverAvgRating * 10) / 10,
            totalRatings: receiverRatings.length
          },
          senderSkill: {
            id: senderUserSkill?.skill.id || '',
            name: senderUserSkill?.skill.name || 'Unknown Skill',
            category: senderUserSkill?.skill.category
          },
          receiverSkill: {
            id: receiverUserSkill?.skill.id || '',
            name: receiverUserSkill?.skill.name || 'Unknown Skill',
            category: receiverUserSkill?.skill.category
          },
          rating: request.rating ? {
            id: request.rating.id,
            swapRequestId: request.rating.swapRequestId,
            giverId: request.rating.giverId,
            receiverId: request.rating.receiverId,
            rating: request.rating.rating,
            feedback: request.rating.feedback,
            createdAt: request.rating.createdAt.toISOString()
          } : undefined
        } as SwapRequestWithDetails
      })
    )

    const pagination: PaginationInfo = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return NextResponse.json({
      success: true,
      data: {
        requests: requestsWithSkills,
        pagination
      }
    })

  } catch (error) {
    console.error('Error fetching swap requests:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { receiverId, senderSkillId, receiverSkillId, message } = await request.json()

    // Validate required fields
    if (!receiverId || !senderSkillId || !receiverSkillId) {
      return NextResponse.json(
        { success: false, error: 'Receiver ID, sender skill ID, and receiver skill ID are required' },
        { status: 400 }
      )
    }

    // Check if sender is not the same as receiver
    if (payload.userId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'You cannot send a request to yourself' },
        { status: 400 }
      )
    }

    // Verify that the sender skill belongs to the current user and is offered
    const senderSkill = await prisma.userSkill.findFirst({
      where: {
        id: senderSkillId,
        userId: payload.userId,
        type: 'OFFERED'
      }
    })

    if (!senderSkill) {
      return NextResponse.json(
        { success: false, error: 'Invalid sender skill. You can only offer skills you have listed.' },
        { status: 400 }
      )
    }

    // Verify that the receiver skill belongs to the target user and is offered
    const receiverSkill = await prisma.userSkill.findFirst({
      where: {
        id: receiverSkillId,
        userId: receiverId,
        type: 'OFFERED'
      }
    })

    if (!receiverSkill) {
      return NextResponse.json(
        { success: false, error: 'Invalid receiver skill. You can only request skills they have offered.' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request with the same skills
    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        senderId: payload.userId,
        receiverId: receiverId,
        senderSkillId: senderSkillId,
        receiverSkillId: receiverSkillId,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending request for these skills' },
        { status: 400 }
      )
    }

    // Create the swap request
    const swapRequest = await prisma.swapRequest.create({
      data: {
        senderId: payload.userId,
        receiverId,
        senderSkillId,
        receiverSkillId,
        message: message || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: swapRequest.id,
        status: swapRequest.status,
        createdAt: swapRequest.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating swap request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
