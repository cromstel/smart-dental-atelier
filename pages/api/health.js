import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed } from '@/lib/api';

/**
 * GET /api/health — uptime probe for the platform (UptimeRobot, Hostinger, …).
 * Returns 503 when the database cannot be reached so the probe actually fails.
 *
 * The failure detail is only included when `DEBUG_MODE` is on. The driver
 * message names the error code and the pool configuration, which is more than
 * an anonymous caller needs to know about the deployment.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const startedAt = Date.now();

  let database = 'skipped';
  if (isDatabaseConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch (error) {
      const body = {
        status: 'degraded',
        database: 'error',
        uptime: Math.round(process.uptime()),
      };
      if (process.env.DEBUG_MODE === 'true') body.detail = error.message;
      return res.status(503).json(body);
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
