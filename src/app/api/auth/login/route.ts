import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations'
import { verifyPassword, generateToken } from '@/lib/auth'
import { handleError, successResponse, validateRequestMethod, getRequestBody } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    validateRequestMethod(request, ['POST'])
    
    const body = await getRequestBody(request)
    const validatedData = loginSchema.parse(body)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (!user) {
      return handleError(new Error('Invalid email or password'))
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return handleError(new Error('Your account has been banned. Please contact support.'))
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)
    
    if (!isValidPassword) {
      return handleError(new Error('Invalid email or password'))
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    // Return user data (excluding password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    
    return successResponse({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    })
    
  } catch (error) {
    return handleError(error)
  }
}
