// src/app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.userId
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalTransactions,
    flaggedTransactions,
    amlAlerts,
    highRisk,
    mediumRisk,
    lowRisk,
    recentActivity,
    subscription,
    avgResult,
  ] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.riskScore.count({ where: { transaction: { userId }, flagged: true } }),
    prisma.riskScore.count({ where: { transaction: { userId }, amlAlert: true } }),
    prisma.riskScore.count({ where: { transaction: { userId }, riskLevel: 'HIGH' } }),
    prisma.riskScore.count({ where: { transaction: { userId }, riskLevel: 'MEDIUM' } }),
    prisma.riskScore.count({ where: { transaction: { userId }, riskLevel: 'LOW' } }),
    prisma.transaction.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      include: { riskScore: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.riskScore.aggregate({
      where: { transaction: { userId } },
      _avg: { score: true },
    }),
  ])

  // Build daily volume from recent transactions (no raw SQL needed)
  const allRecent = await prisma.transaction.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    include: { riskScore: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const volumeMap: Record<string, { count: number; totalScore: number }> = {}
  allRecent.forEach(tx => {
    const dateKey = tx.createdAt.toISOString().slice(0, 10)
    if (!volumeMap[dateKey]) volumeMap[dateKey] = { count: 0, totalScore: 0 }
    volumeMap[dateKey].count++
    if (tx.riskScore) volumeMap[dateKey].totalScore += tx.riskScore.score
  })

  const dailyVolume = Object.entries(volumeMap).map(([date, v]) => ({
    date,
    count: v.count,
    avg_score: v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
  }))

  return NextResponse.json({
    totalTransactions,
    flaggedTransactions,
    amlAlerts,
    riskBreakdown: { high: highRisk, medium: mediumRisk, low: lowRisk },
    avgRiskScore: Math.round(avgResult._avg.score || 0),
    recentActivity,
    dailyVolume,
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      used: subscription.transactionsUsed,
      limit: subscription.transactionLimit,
      periodEnd: subscription.currentPeriodEnd,
    } : null,
  })
}
