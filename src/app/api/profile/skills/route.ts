import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSkillSchema } from '@/lib/validations'
import { handleError, successResponse, validateRequestMethod, getRequestBody } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    validateRequestMethod(request, ['POST'])
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return handleError(new Error('Unauthorized'))
    }

    const body = await getRequestBody(request)
    const validatedData = userSkillSchema.parse(body)

    // Check if user already has this skill with this type
    const existingSkill = await prisma.userSkill.findFirst({
      where: {
        userId: userId,
        skillId: validatedData.skillId,
        type: validatedData.type,
      }
    })

    if (existingSkill) {
      return handleError(new Error('You already have this skill in your list'))
    }

    // Create the user skill
    const userSkill = await prisma.userSkill.create({
      data: {
        userId: userId,
        skillId: validatedData.skillId,
        type: validatedData.type,
        level: validatedData.level,
        description: validatedData.description,
      },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        }
      }
    })

    const response = {
      id: userSkill.id,
      skillId: userSkill.skill.id,
      skillName: userSkill.skill.name,
      level: userSkill.level,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}
