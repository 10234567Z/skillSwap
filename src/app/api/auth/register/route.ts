import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'
import { hashPassword, generateToken } from '@/lib/auth'
import { handleError, successResponse, validateRequestMethod, getRequestBody } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    validateRequestMethod(request, ['POST'])
    
    const body = await getRequestBody(request)
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return handleError(new Error('User already exists with this email'))
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password)
    
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        location: validatedData.location,
        availability: validatedData.availability || [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        location: true,
        availability: true,
        role: true,
        createdAt: true,
      }
    })
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    return successResponse({
      user,
      token,
      message: 'User registered successfully'
    }, 201)
    
  } catch (error) {
    return handleError(error)
  }
}
