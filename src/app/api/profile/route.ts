import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations'
import { handleError, successResponse, validateRequestMethod, getRequestBody } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    validateRequestMethod(request, ['GET'])
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return handleError(new Error('Unauthorized'))
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        isPublic: true,
        availability: true,
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
        }
      }
    })

    if (!user) {
      return handleError(new Error('User not found'))
    }

    const skillsOffered = user.userSkills
      .filter(us => us.type === 'OFFERED')
      .map(us => ({
        id: us.id,
        skillId: us.skill.id,
        skillName: us.skill.name,
        level: us.level,
      }))
    
    const skillsWanted = user.userSkills
      .filter(us => us.type === 'WANTED')
      .map(us => ({
        id: us.id,
        skillId: us.skill.id,
        skillName: us.skill.name,
        level: us.level,
      }))

    const profile = {
      ...user,
      skillsOffered,
      skillsWanted
    }

    return successResponse(profile)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    validateRequestMethod(request, ['PUT'])
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return handleError(new Error('Unauthorized'))
    }

    const body = await getRequestBody(request)
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validatedData.name,
        location: validatedData.location || null,
        profilePhoto: validatedData.profilePhoto || null,
        isPublic: validatedData.isPublic,
        availability: validatedData.availability,
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        isPublic: true,
        availability: true,
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
        }
      }
    })

    const skillsOffered = updatedUser.userSkills
      .filter(us => us.type === 'OFFERED')
      .map(us => ({
        id: us.id,
        skillId: us.skill.id,
        skillName: us.skill.name,
        level: us.level,
      }))
    
    const skillsWanted = updatedUser.userSkills
      .filter(us => us.type === 'WANTED')
      .map(us => ({
        id: us.id,
        skillId: us.skill.id,
        skillName: us.skill.name,
        level: us.level,
      }))

    const profile = {
      ...updatedUser,
      skillsOffered,
      skillsWanted
    }

    return successResponse(profile)
  } catch (error) {
    return handleError(error)
  }
}
