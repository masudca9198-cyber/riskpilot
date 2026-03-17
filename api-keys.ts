// src/lib/api-keys.ts
import { prisma } from './prisma'
import crypto from 'crypto'

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `rp_${crypto.randomBytes(32).toString('hex')}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  const prefix = key.substring(0, 10)
  return { key, hash, prefix }
}

export async function validateApiKey(key: string) {
  if (!key || !key.startsWith('rp_')) return null

  const hash = crypto.createHash('sha256').update(key).digest('hex')

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash, isActive: true },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!apiKey) return null

  // Update usage metadata (non-blocking)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
    })
    .catch(() => {})

  return apiKey
}
