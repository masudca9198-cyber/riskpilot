// src/lib/rate-limit.ts
// In-memory store. For production, swap for Redis (@upstash/ratelimit recommended).
const rateStore = new Map<string, { count: number; reset: number }>()

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number
}

export function rateLimit(config: RateLimitConfig) {
  return function check(identifier: string): RateLimitResult {
    const now = Date.now()
    const record = rateStore.get(identifier)

    if (!record || now > record.reset) {
      rateStore.set(identifier, { count: 1, reset: now + config.windowMs })
      return { allowed: true, remaining: config.limit - 1, reset: now + config.windowMs }
    }

    if (record.count >= config.limit) {
      return { allowed: false, remaining: 0, reset: record.reset }
    }

    record.count++
    return { allowed: true, remaining: config.limit - record.count, reset: record.reset }
  }
}

// Pre-configured limiters
export const apiRateLimit   = rateLimit({ limit: 100, windowMs: 60_000 })       // 100/min
export const authRateLimit  = rateLimit({ limit: 10,  windowMs: 15 * 60_000 })  // 10/15min
export const strictRateLimit = rateLimit({ limit: 5,  windowMs: 60_000 })       // 5/min

// Periodic cleanup to prevent memory leaks in long-running processes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateStore.entries()) {
      if (now > val.reset) rateStore.delete(key)
    }
  }, 5 * 60_000)
}
