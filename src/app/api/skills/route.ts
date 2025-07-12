import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, successResponse, validateRequestMethod } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    validateRequestMethod(request, ['GET'])

    const skills = await prisma.skill.findMany({
      where: {
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return successResponse(skills)
  } catch (error) {
    return handleError(error)
  }
}
