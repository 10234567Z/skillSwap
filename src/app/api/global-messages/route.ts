import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const messages = await prisma.adminMessage.findMany({
      where: {
        isActive: true,
        isGlobal: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: messages
    })
  } catch (error) {
    console.error('Error fetching global messages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch global messages' 
      },
      { status: 500 }
    )
  }
}
