import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchSchema } from '@/lib/validations'
import { handleError, successResponse, validateRequestMethod } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    validateRequestMethod(request, ['GET'])
    
    const { searchParams } = new URL(request.url)
    const queryParams = {
      query: searchParams.get('search') || undefined, // Note: using 'search' parameter
      skillCategory: searchParams.get('skillCategory') || undefined,
      location: searchParams.get('location') || undefined,
      skillLevel: searchParams.get('skillLevel') || undefined,
      availability: searchParams.get('availability') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    }
    
    const validatedParams = searchSchema.parse(queryParams)
    const { page, limit, query, skillCategory, location, skillLevel } = validatedParams
    const skip = (page - 1) * limit
    
    // Build dynamic where clause for search
    const whereConditions: Record<string, unknown>[] = [
      { isPublic: true }, // Only public profiles
      { isBanned: false }, // Not banned users
    ]
    
    // Add search condition if query exists
    if (query) {
      whereConditions.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          // Search in user's skills
          {
            userSkills: {
              some: {
                skill: {
                  name: { contains: query, mode: 'insensitive' }
                }
              }
            }
          }
        ]
      })
    }
    
    // Add location filter if provided
    if (location) {
      whereConditions.push({ location: { contains: location, mode: 'insensitive' } })
    }
    
    // Add availability filter if provided
    if (queryParams.availability) {
      whereConditions.push({
        availability: {
          has: queryParams.availability
        }
      })
    }
     // Add skill-based filtering if specified
    if (skillCategory || skillLevel) {
      const skillFilterConditions: Record<string, unknown>[] = []
      
      if (skillCategory) {
        skillFilterConditions.push({
          skill: {
            category: { equals: skillCategory, mode: 'insensitive' }
          }
        })
      }
      
      if (skillLevel) {
        skillFilterConditions.push({ level: skillLevel })
      }
      
      whereConditions.push({
        userSkills: {
          some: {
            AND: skillFilterConditions
          }
        }
      })
    }

    const whereClause: Record<string, unknown> = {
      AND: whereConditions
    }
    
    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          location: true,
          profilePhoto: true,
          availability: true,
          createdAt: true,
          userSkills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                }
              }
            }
          },
          receivedRatings: {
            select: {
              rating: true,
            }
          },
          _count: {
            select: {
              receivedRatings: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        }
      }),
      prisma.user.count({
        where: whereClause,
      })
    ])
    
    // Calculate average ratings and format response
    const usersWithRatings = users.map(user => {
      const ratings = user.receivedRatings.map(r => r.rating)
      const averageRating = ratings.length > 0 
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 0
      
      const skillsOffered = user.userSkills
        .filter(us => us.type === 'OFFERED')
        .map(us => ({
          id: us.skill.id,
          name: us.skill.name,
          category: us.skill.category,
          level: us.level,
        }))
      
      const skillsWanted = user.userSkills
        .filter(us => us.type === 'WANTED')
        .map(us => ({
          id: us.skill.id,
          name: us.skill.name,
          category: us.skill.category,
          level: us.level,
        }))
      
      return {
        id: user.id,
        name: user.name,
        location: user.location,
        profilePhoto: user.profilePhoto,
        availability: user.availability,
        skillsOffered,
        skillsWanted,
        averageRating,
        totalRatings: user._count.receivedRatings,
      }
    })
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return successResponse({
      users: usersWithRatings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        query,
        skillCategory,
        location,
        skillLevel,
        availability: queryParams.availability,
      }
    })
    
  } catch (error) {
    return handleError(error)
  }
}
