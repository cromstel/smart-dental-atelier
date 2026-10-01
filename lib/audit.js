import { prisma, isDatabaseConfigured } from './prisma';

/**
 * Append-only audit trail for admin mutations.
 * Never blocks the request: a logging failure must not break the write path.
 *
 * @param {{userId?: number, action: string, entity: string, entityId?: string|number, payload?: object}} entry
 */
export async function audit({ userId, action, entity, entityId, payload }) {
  if (!isDatabaseConfigured) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId === undefined || entityId === null ? null : String(entityId),
        payload: payload ?? undefined,
      },
    });
  } catch (error) {
    console.error('[audit] failed to record entry:', error.message);
  }
}