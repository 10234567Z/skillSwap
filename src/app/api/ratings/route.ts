import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    const { swapRequestId, rating, feedback } = await request.json()

    // Validate required fields
    if (!swapRequestId || !rating) {
      return NextResponse.json(
        { success: false, error: 'Swap request ID and rating are required' },
        { status: 400 }
      )
    }

    // Validate rating value (1-5)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    // Find the swap request
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: { rating: true }
    })

    if (!swapRequest) {
      return NextResponse.json(
        { success: false, error: 'Swap request not found' },
        { status: 404 }
      )
    }

    // Check if request is accepted/completed
    if (swapRequest.status !== 'ACCEPTED' && swapRequest.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'You can only rate accepted or completed swap requests' },
        { status: 400 }
      )
    }

    // Check if user is part of this swap request
    if (swapRequest.senderId !== payload.userId && swapRequest.receiverId !== payload.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only rate swap requests you are part of' },
        { status: 403 }
      )
    }

    // Check if rating already exists
    if (swapRequest.rating) {
      return NextResponse.json(
        { success: false, error: 'This swap request has already been rated' },
        { status: 400 }
      )
    }

    // Determine who is being rated (the other person in the swap)
    const receiverId = swapRequest.senderId === payload.userId 
      ? swapRequest.receiverId 
      : swapRequest.senderId

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        swapRequestId,
        giverId: payload.userId,
        receiverId,
        rating,
        feedback: feedback?.trim() || null
      }
    })

    // Update swap request status to COMPLETED if not already
    if (swapRequest.status === 'ACCEPTED') {
      await prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newRating.id,
        swapRequestId: newRating.swapRequestId,
        rating: newRating.rating,
        feedback: newRating.feedback,
        createdAt: newRating.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating rating:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
