// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@riskpilot.io' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@riskpilot.io',
      name: 'RiskPilot Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })
  console.log(`✅ Admin user: ${admin.email}`)

  // Create demo user
  const userHash = await bcrypt.hash('Demo@123456', 12)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@riskpilot.io' },
    update: {},
    create: {
      email: 'demo@riskpilot.io',
      name: 'Demo User',
      passwordHash: userHash,
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      workspace: {
        create: { name: "Demo Workspace", slug: 'demo-workspace' }
      },
      subscription: {
        create: {
          plan: 'STARTER',
          status: 'ACTIVE',
          transactionLimit: 10000,
          transactionsUsed: 342,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      }
    },
  })
  console.log(`✅ Demo user: ${demo.email} / Demo@123456`)

  console.log('✨ Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
