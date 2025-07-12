import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, successResponse, validateRequestMethod } from '@/lib/api-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    validateRequestMethod(request, ['DELETE'])
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return handleError(new Error('Unauthorized'))
    }

    const userSkillId = params.id

    // Check if the skill belongs to the user
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        id: userSkillId,
        userId: userId,
      }
    })

    if (!userSkill) {
      return handleError(new Error('Skill not found or access denied'))
    }

    // Delete the user skill
    await prisma.userSkill.delete({
      where: {
        id: userSkillId,
      }
    })

    return successResponse({ message: 'Skill removed successfully' })
  } catch (error) {
    return handleError(error)
  }
}
