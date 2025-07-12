import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Admin middleware check
async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { success: false, error: 'Authentication required', status: 401 }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { success: false, error: 'Invalid token', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required', status: 403 }
  }

  return { success: true, userId: payload.userId }
}

// GET /api/admin/reports?type=users|swaps&format=json|csv
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request)
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const format = searchParams.get('format') || 'json'

    if (type === 'users') {
      // User Activity Report
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [
        totalRegistrations,
        registrationsThisMonth,
        activeUsersLastWeek,
        topLocations,
        registrationsByMonth
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({
          where: {
            role: 'USER',
            createdAt: { gte: lastMonth }
          }
        }),
        prisma.user.count({
          where: {
            role: 'USER',
            updatedAt: { gte: lastWeek }
          }
        }),
        prisma.user.groupBy({
          by: ['location'],
          where: {
            role: 'USER',
            location: { not: null }
          },
          _count: { location: true },
          orderBy: { _count: { location: 'desc' } },
          take: 10
        }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM users 
          WHERE role = 'USER' 
          AND "createdAt" >= NOW() - INTERVAL '12 months'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month DESC
        `
      ])

      const reportData = {
        totalRegistrations,
        registrationsThisMonth,
        activeUsersLastWeek,
        topLocations: topLocations.map(item => ({
          location: item.location!,
          count: item._count.location
        })),
        registrationsByMonth: registrationsByMonth as Array<{ month: string; count: number }>
      }

      if (format === 'csv') {
        // Generate CSV
        const csv = [
          'Metric,Value',
          `Total Registrations,${totalRegistrations}`,
          `Registrations This Month,${registrationsThisMonth}`,
          `Active Users Last Week,${activeUsersLastWeek}`,
          '',
          'Top Locations,User Count',
          ...topLocations.map(item => `${item.location},${item._count.location}`),
          '',
          'Month,Registrations',
          ...(registrationsByMonth as Array<{ month: string; count: number }>).map(item => `${item.month},${item.count}`)
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="user-activity-report.csv"'
          }
        })
      }

      return NextResponse.json({ success: true, data: reportData })
    }

    if (type === 'swaps') {
      // Swap Statistics Report
      const [
        totalRequests,
        completedSwaps,
        popularSkills,
        swapsByStatus,
        averageRating,
        swapsByMonth
      ] = await Promise.all([
        prisma.swapRequest.count(),
        prisma.swapRequest.count({ where: { status: 'COMPLETED' } }),
        prisma.$queryRaw`
          SELECT 
            s.name as skill,
            COUNT(sr.id)::int as requests
          FROM swap_requests sr
          JOIN user_skills us ON sr."senderSkillId" = us.id OR sr."receiverSkillId" = us.id
          JOIN skills s ON us."skillId" = s.id
          GROUP BY s.name
          ORDER BY requests DESC
          LIMIT 10
        `,
        prisma.swapRequest.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.rating.aggregate({
          _avg: { rating: true }
        }),
        prisma.$queryRaw`
          SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            COUNT(*)::int as count
          FROM swap_requests 
          WHERE "createdAt" >= NOW() - INTERVAL '12 months'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month DESC
        `
      ])

      const completionRate = totalRequests > 0 ? (completedSwaps / totalRequests) * 100 : 0

      const reportData = {
        totalRequests,
        completionRate: Math.round(completionRate * 100) / 100,
        popularSkills: popularSkills as Array<{ skill: string; requests: number }>,
        swapsByStatus: swapsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        averageRating: Math.round((averageRating._avg.rating || 0) * 100) / 100,
        swapsByMonth: swapsByMonth as Array<{ month: string; count: number }>
      }

      if (format === 'csv') {
        // Generate CSV
        const csv = [
          'Metric,Value',
          `Total Requests,${totalRequests}`,
          `Completion Rate,${reportData.completionRate}%`,
          `Average Rating,${reportData.averageRating}/5`,
          '',
          'Popular Skills,Request Count',
          ...reportData.popularSkills.map(item => `${item.skill},${item.requests}`),
          '',
          'Status,Count',
          ...reportData.swapsByStatus.map(item => `${item.status},${item.count}`),
          '',
          'Month,Swap Requests',
          ...reportData.swapsByMonth.map(item => `${item.month},${item.count}`)
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="swap-statistics-report.csv"'
          }
        })
      }

      return NextResponse.json({ success: true, data: reportData })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid report type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
