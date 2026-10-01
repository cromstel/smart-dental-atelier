/**
 * Client-portal API tests.
 *
 * The property that matters here is tenant isolation: every query must be
 * scoped to the session user, so a client can never read or cancel somebody
 * else's appointment by guessing an id.
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    appointment: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    contactMessage: { findMany: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
  isDatabaseConfigured: true,
}));

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn() }));

const { getToken } = require('next-auth/jwt');
const { prisma } = require('@/lib/prisma');
const { callApi } = require('../helpers/api-mock');

const appointmentsHandler = require('@/pages/api/portal/appointments').default;
const messagesHandler = require('@/pages/api/portal/messages').default;
const profileHandler = require('@/pages/api/portal/profile').default;

beforeEach(() => {
  jest.clearAllMocks();
  getToken.mockResolvedValue({ sub: '5', role: 'CLIENT' });
  prisma.user.findUnique.mockResolvedValue({
    id: 5,
    email: 'client@example.com',
    name: 'Client Test',
    role: 'CLIENT',
    isActive: true,
  });
});

describe('/api/portal/appointments', () => {
  it('answers 401 when there is no session', async () => {
    getToken.mockResolvedValue(null);

    const { status } = await callApi(appointmentsHandler, { method: 'GET' });
    expect(status).toBe(401);
    expect(prisma.appointment.findMany).not.toHaveBeenCalled();
  });

  it('scopes the list to the signed-in user', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    const { status } = await callApi(appointmentsHandler, { method: 'GET' });

    expect(status).toBe(200);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 5 } }),
    );
  });

  it('never selects the internal notes column', async () => {
    prisma.appointment.findMany.mockResolvedValue([]);

    await callApi(appointmentsHandler, { method: 'GET' });

    const select = prisma.appointment.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty('internalNotes');
    expect(select).not.toHaveProperty('email');
  });

  it('refuses to cancel an appointment belonging to somebody else', async () => {
    // findFirst returns null → the record is not visible to this user at all.
    prisma.appointment.findFirst.mockResolvedValue(null);

    const { status, data } = await callApi(appointmentsHandler, {
      method: 'PATCH',
      body: { id: 99, action: 'cancel' },
    });

    expect(status).toBe(404);
    expect(data.error).toMatch(/not found/i);
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it('cancels a pending appointment that belongs to the user', async () => {
    prisma.appointment.findFirst.mockResolvedValue({ id: 3, status: 'PENDING' });
    prisma.appointment.update.mockResolvedValue({ id: 3, status: 'CANCELLED' });

    const { status, data } = await callApi(appointmentsHandler, {
      method: 'PATCH',
      body: { id: 3, action: 'cancel' },
    });

    expect(status).toBe(200);
    expect(data.status).toBe('CANCELLED');
    // The lookup must have been scoped to the user id.
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3, userId: 5 } }),
    );
  });

  it('will not cancel an appointment that already happened', async () => {
    prisma.appointment.findFirst.mockResolvedValue({ id: 3, status: 'COMPLETED' });

    const { status, data } = await callApi(appointmentsHandler, {
      method: 'PATCH',
      body: { id: 3, action: 'cancel' },
    });

    expect(status).toBe(409);
    expect(data.error).toMatch(/call us/i);
  });

  it('only supports the cancel action', async () => {
    const { status, data } = await callApi(appointmentsHandler, {
      method: 'PATCH',
      body: { id: 3, action: 'mark-as-done' },
    });

    expect(status).toBe(422);
    expect(data.error).toMatch(/only the "cancel" action/i);
  });
});

describe('/api/portal/messages', () => {
  it('scopes the history to the signed-in user', async () => {
    prisma.contactMessage.findMany.mockResolvedValue([]);

    await callApi(messagesHandler, { method: 'GET' });

    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 5 } }),
    );
  });

  it('stores a new message against the account, not against posted fields', async () => {
    prisma.contactMessage.create.mockResolvedValue({ id: 11 });

    const { status } = await callApi(messagesHandler, {
      method: 'POST',
      body: { message: 'Could we move my appointment to Thursday?', email: 'someone-else@example.com' },
    });

    expect(status).toBe(201);
    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 5,
          email: 'client@example.com', // from the session, not the body
          source: 'PORTAL',
        }),
      }),
    );
  });

  it('rejects an empty message', async () => {
    const { status } = await callApi(messagesHandler, { method: 'POST', body: { message: '   ' } });
    expect(status).toBe(422);
  });
});

describe('/api/portal/profile', () => {
  it('refuses a role change coming from the client portal', async () => {
    // profileSchema has no `role` key, so Zod strips it before the handler runs.
    const { status } = await callApi(profileHandler, {
      method: 'PUT',
      body: { name: 'Client Test', email: 'client@example.com', role: 'ADMIN' },
    });

    expect(status).toBe(200);
    const updateArgs = prisma.user.update.mock.calls[0][0].data;
    expect(updateArgs).not.toHaveProperty('role');
    expect(updateArgs).not.toHaveProperty('isActive');
  });

  it('never lets a client set or clear their own password by omission', async () => {
    prisma.user.update.mockResolvedValue({ id: 5, name: 'Client Test', email: 'client@example.com', role: 'CLIENT' });

    const { status } = await callApi(profileHandler, {
      method: 'PUT',
      body: { name: 'Renamed', email: 'client@example.com' },
    });

    expect(status).toBe(200);
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty('password');
  });

  it('reports a conflicting e-mail address', async () => {
  // Someone else's account already owns this address.
    prisma.user.findUnique.mockImplementation(async ({ where }) =>
      where.id === 5
        ? { id: 5, email: 'client@example.com', name: 'Client Test', role: 'CLIENT', isActive: true }
        : { id: 9 },
    );

    const { status, data } = await callApi(profileHandler, {
      method: 'PUT',
      body: { email: 'taken@example.com' },
    });

    expect(status).toBe(409);
    expect(data.error).toMatch(/already in use/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});