import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PublicUser } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user with skills and ratings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        location: true,
        profilePhoto: true,
        availability: true,
        isPublic: true,
        createdAt: true,
        userSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        },
        receivedRatings: {
          select: {
            rating: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if profile is public (if not, only allow access to own profile)
    // For now, we'll show all profiles since we don't have auth check here
    // You might want to add auth verification if needed

    // Calculate average rating
    const ratings = user.receivedRatings
    const averageRating = ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
      : 0

    // Group skills by type
    const skillsOffered = user.userSkills
      .filter(us => us.type === 'OFFERED')
      .map(us => ({
        id: us.id, // Use UserSkill ID, not Skill ID
        name: us.skill.name,
        category: us.skill.category || undefined,
        level: us.level
      }))

    const skillsWanted = user.userSkills
      .filter(us => us.type === 'WANTED')
      .map(us => ({
        id: us.id, // Use UserSkill ID, not Skill ID
        name: us.skill.name,
        category: us.skill.category || undefined,
        level: us.level
      }))

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      location: user.location || undefined,
      profilePhoto: user.profilePhoto || undefined,
      availability: user.availability,
      skillsOffered,
      skillsWanted,
      averageRating,
      totalRatings: ratings.length
    }

    return NextResponse.json({
      success: true,
      data: publicUser
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
