import { prisma, isDatabaseConfigured } from './prisma';
import { withWriteRetry } from './auth';

/**
 * Append-only audit trail for admin mutations.
 * Never blocks the request: a logging failure must not break the write path.
 *
 * Writes go through `withWriteRetry` because the audit row can land on the same
 * record another connection just touched, which MariaDB reports as a transient
 * 1020 — retrying is correct, and losing the audit line is not.
 *
 * @param {{userId?: number, action: string, entity: string, entityId?: string|number, payload?: object}} entry
 */
export async function audit({ userId, action, entity, entityId, payload }) {
  if (!isDatabaseConfigured) return;

  try {
    await withWriteRetry(() =>
      prisma.auditLog.create({
        data: {
          userId: userId ?? null,
          action,
          entity,
          entityId: entityId === undefined || entityId === null ? null : String(entityId),
          payload: payload ?? undefined,
        },
      }),
    );
  } catch (error) {
    console.error('[audit] failed to record entry:', error.message);
  }
}