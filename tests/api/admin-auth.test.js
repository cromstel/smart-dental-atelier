/**
 * Authorisation tests for the admin API surface.
 *
 * These lock down the single most important security property of the project:
 * no `/api/admin/**` route may read or write anything without an ADMIN
 * session. The guard is shared (`lib/api.js: requireAdmin`), so the tests
 * sweep every admin route rather than trusting one representative handler.
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contactMessage: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn(), update: jest.fn(), delete: jest.fn() },
    testimonial: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    faq: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    service: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    galleryImage: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    user: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    setting: { findMany: jest.fn(), upsert: jest.fn() },
    page: { findMany: jest.fn(), upsert: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn() },
    newsletterSubscriber: { findUnique: jest.fn(), update: jest.fn() },
    $queryRaw: jest.fn(),
  },
  isDatabaseConfigured: true,
}));

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));
jest.mock('@/lib/mailer', () => ({
  notifyMessage: jest.fn(() => Promise.resolve()),
  notifyAppointment: jest.fn(() => Promise.resolve()),
}));

const { getToken } = require('next-auth/jwt');
const { prisma } = require('@/lib/prisma');
const { callApi } = require('../helpers/api-mock');

const ADMIN_ROUTES = [
  ['appointments', require('@/pages/api/admin/appointments')],
  ['appointments/12', require('@/pages/api/admin/appointments/[id]')],
  ['messages', require('@/pages/api/admin/messages')],
  ['messages/12', require('@/pages/api/admin/messages/[id]')],
  ['testimonials', require('@/pages/api/admin/testimonials')],
  ['testimonials/12', require('@/pages/api/admin/testimonials/[id]')],
  ['faqs', require('@/pages/api/admin/faqs')],
  ['faqs/12', require('@/pages/api/admin/faqs/[id]')],
  ['services', require('@/pages/api/admin/services')],
  ['services/12', require('@/pages/api/admin/services/[id]')],
  ['gallery/12', require('@/pages/api/admin/gallery/[id]')],
  ['users', require('@/pages/api/admin/users')],
  ['users/12', require('@/pages/api/admin/users/[id]')],
  ['settings', require('@/pages/api/admin/settings')],
  ['pages', require('@/pages/api/admin/pages')],
  ['audit', require('@/pages/api/admin/audit')],
];

beforeEach(() => {
  jest.clearAllMocks();
  prisma.auditLog.create.mockResolvedValue({});
  prisma.user.findUnique.mockResolvedValue(null);
});

describe('admin authorisation', () => {
  it.each(ADMIN_ROUTES)('GET /api/admin/%s answers 401 without a session', async (_name, route) => {
    getToken.mockResolvedValue(null);
    const { status, data } = await callApi(route.default, { method: 'GET' });

    expect(status).toBe(401);
    expect(data.error).toMatch(/sign in/i);
  });

  it.each(ADMIN_ROUTES)('GET /api/admin/%s answers 403 for a signed-in CLIENT', async (_name, route) => {
    getToken.mockResolvedValue({ sub: '7', role: 'CLIENT' });
    prisma.user.findUnique.mockResolvedValue({ id: 7, role: 'CLIENT', isActive: true });

    const { status, data } = await callApi(route.default, { method: 'GET' });

    expect(status).toBe(403);
    expect(data.error).toMatch(/administrator/i);
  });

  it.each(ADMIN_ROUTES)('GET /api/admin/%s answers 403 for a deactivated admin', async (_name, route) => {
    getToken.mockResolvedValue({ sub: '1', role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', isActive: false });

    const { status } = await callApi(route.default, { method: 'GET' });
    expect(status).toBe(403);
  });
});

describe('admin CRUD with an ADMIN session', () => {
  beforeEach(() => {
    getToken.mockResolvedValue({ sub: '1', role: 'ADMIN' });
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', isActive: true, email: 'admin@example.com' });
  });

  it('lists appointments and never exposes internal data of another role', async () => {
    prisma.appointment.count.mockResolvedValue(0);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.groupBy.mockResolvedValue([]);

    const { status, data } = await callApi(require('@/pages/api/admin/appointments').default, { method: 'GET' });

    expect(status).toBe(200);
    expect(data).toMatchObject({ total: 0, pageCount: 1 });
    expect(data.appointments).toEqual([]);
  });

  it('ignores an unknown status filter instead of passing it to the database', async () => {
    prisma.appointment.count.mockResolvedValue(0);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.groupBy.mockResolvedValue([]);

    await callApi(require('@/pages/api/admin/appointments').default, {
      method: 'GET',
      query: { status: "PENDING'); DROP TABLE Appointment;--" },
    });

    // The filter must be dropped, so the query has no `where` clause at all.
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('records an audit entry when an appointment is created', async () => {
    prisma.appointment.create.mockResolvedValue({ id: 42, firstName: 'Ada' });

    const { status } = await callApi(require('@/pages/api/admin/appointments').default, {
      method: 'POST',
      body: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    });

    expect(status).toBe(201);
    // entityId is stored as a string (the column is a String); userId links the
    // entry to the admin who made the change.
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'create', entity: 'Appointment', entityId: '42', userId: 1 }),
    });
  });

  it('rejects a settings key that is not part of the registry', async () => {
    const { status, data } = await callApi(require('@/pages/api/admin/settings').default, {
      method: 'PUT',
      body: { settings: [{ key: 'evil.injected', value: 'x' }] },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/Unknown setting key/);
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
  });

  it('rejects a page slug that is not a page of this site', async () => {
    const { status, data } = await callApi(require('@/pages/api/admin/pages').default, {
      method: 'PUT',
      body: { slug: 'not-a-real-page', title: 'X', description: 'Y' },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/not a page of this site/i);
  });

  it('refuses to let an admin delete their own account', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN', isActive: true });

    const { status, data } = await callApi(require('@/pages/api/admin/users/[id]').default, {
      method: 'DELETE',
      query: { id: '1' },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/your own account/i);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  /**
   * `findUnique` serves two roles here: the caller's own record (from the
   * session) and the record being edited (from the `?id=` query). Route them by
   * argument so "self" and "other" can be told apart.
   */
  const asUser = (self, target) =>
    prisma.user.findUnique.mockImplementation(async ({ where }) =>
      where.id === self.id ? self : target,
    );

  it('refuses to demote the last active administrator', async () => {
    asUser({ id: 1, role: 'ADMIN', isActive: true }, { id: 9, role: 'ADMIN', isActive: true });
    prisma.user.count.mockResolvedValue(0); // no other admins remain

    const { status, data } = await callApi(require('@/pages/api/admin/users/[id]').default, {
      method: 'PUT',
      query: { id: '9' },
      body: { email: 'other@example.com', role: 'CLIENT' },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/last active administrator/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('allows demoting another admin while a second one remains', async () => {
    asUser({ id: 1, role: 'ADMIN', isActive: true }, { id: 9, role: 'ADMIN', isActive: true });
    prisma.user.count.mockResolvedValue(1);
    prisma.user.update.mockResolvedValue({ id: 9, role: 'CLIENT', isActive: true, email: 'other@example.com' });

    const { status, data } = await callApi(require('@/pages/api/admin/users/[id]').default, {
      method: 'PUT',
      query: { id: '9' },
      body: { email: 'other@example.com', role: 'CLIENT' },
    });

    expect(status).toBe(200);
    expect(data.role).toBe('CLIENT');
  });

  it('refuses to let an admin demote themselves', async () => {
    asUser({ id: 1, role: 'ADMIN', isActive: true }, { id: 1, role: 'ADMIN', isActive: true });

    const { status, data } = await callApi(require('@/pages/api/admin/users/[id]').default, {
      method: 'PUT',
      query: { id: '1' },
      body: { email: 'admin@example.com', role: 'CLIENT' },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/your own administrator role/i);
  });

  it('never returns a password hash from the users list', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([
      { id: 2, name: 'Client', email: 'c@example.com', role: 'CLIENT', isActive: true },
    ]);

    const { status, data } = await callApi(require('@/pages/api/admin/users').default, { method: 'GET' });

    expect(status).toBe(200);
    expect(JSON.stringify(data)).not.toMatch(/\$2[aby]\$/); // a bcrypt hash
    expect(data.users[0]).not.toHaveProperty('password');
  });

  it('refuses to delete a service that appointments still reference', async () => {
    prisma.service.findUnique.mockResolvedValue({ id: 3, slug: 'veneers' });
    prisma.appointment.count.mockResolvedValue(4);

    const { status, data } = await callApi(require('@/pages/api/admin/services/[id]').default, {
      method: 'DELETE',
      query: { id: '3' },
    });

    expect(status).toBe(409);
    expect(data.error).toMatch(/appointment request/i);
    expect(prisma.service.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for a record that does not exist', async () => {
    prisma.faq.findUnique.mockResolvedValue(null);

    const { status, data } = await callApi(require('@/pages/api/admin/faqs/[id]').default, {
      method: 'DELETE',
      query: { id: '999' },
    });

    expect(status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  it('rejects a malformed id with 400', async () => {
    const { status } = await callApi(require('@/pages/api/admin/faqs/[id]').default, {
      method: 'DELETE',
      query: { id: 'abc' },
    });

    expect(status).toBe(400);
  });
});