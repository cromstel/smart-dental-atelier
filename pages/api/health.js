import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler } from '@/lib/api';

/**
 * GET /api/health — uptime probe for the platform (UptimeRobot, Hostinger, …).
 * Returns 503 when the database cannot be reached so the probe actually fails.
 */
export default apiHandler(async (req, res) => {
  const startedAt = Date.now();

  let database = 'skipped';
  if (isDatabaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch (error) {
      return res.status(503).json({
        status: 'degraded',
        database: 'error',
        detail: error.message,
        uptime: Math.round(process.uptime()),
      });
    }
  }

  return res.status(200).json({
    status: 'ok',
    database,
    version: process.env.npm_package_version || 'dev',
    uptime: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});