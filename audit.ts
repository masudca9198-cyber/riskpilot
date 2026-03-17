// src/lib/audit.ts
import { prisma } from './prisma'

export type AuditAction =
  | 'USER_SIGNUP'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_PASSWORD_RESET'
  | 'USER_EMAIL_VERIFIED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_CANCELED'
  | 'TRANSACTION_ANALYZED'
  | 'ADMIN_USER_SUSPENDED'
  | 'ADMIN_USER_ACTIVATED'

interface AuditOptions {
  userId?: string
  action: AuditAction
  details?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Writes an audit log entry. Fire-and-forget — errors are swallowed so
 * they never interrupt the main request flow.
 */
export function auditLog(options: AuditOptions): void {
  prisma.auditLog
    .create({
      data: {
        userId: options.userId,
        action: options.action,
        details: options.details as any,
        ipAddress: options.ipAddress,
      },
    })
    .catch(err => console.error('[AuditLog] Failed to write entry:', err))
}
