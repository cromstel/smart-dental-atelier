/**
 * API tests for the public form endpoints.
 *
 * Prisma is mocked at the module level, so these verify the handler logic
 * (validation, honeypot, rate-limit short-circuit, status codes, response
 * shape) without needing a MySQL server. The 422 field map and the silent 200
 * for honeypot hits are the behaviours most worth locking down, because both
 * are easy to regress and hard to notice.
 */
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactMessage: { create: jest.fn() },
    appointment: { create: jest.fn(), findFirst: jest.fn() },
    newsletterSubscriber: { upsert: jest.fn() },
  },
  isDatabaseConfigured: true,
}));

jest.mock('@/lib/mailer', () => ({
  notifyMessage: jest.fn(() => Promise.resolve()),
  notifyAppointment: jest.fn(() => Promise.resolve()),
}));

jest.mock('next-auth/jwt', () => ({ getToken: jest.fn(async () => null) }));

const { prisma } = require('@/lib/prisma');
const { notifyMessage, notifyAppointment } = require('@/lib/mailer');
const contactHandler = require('@/pages/api/contact').default;
const smileCheckHandler = require('@/pages/api/smile-check').default;
const requestInfoHandler = require('@/pages/api/request-info').default;
const appointmentsHandler = require('@/pages/api/appointments').default;
const newsletterHandler = require('@/pages/api/newsletter').default;
const { callApi } = require('../helpers/api-mock');

/**
 * The rate limiter is a module-level map shared across tests in a file. These
 * suites deliberately exercise more than five POSTs per endpoint, so the
 * bucket is reset between tests — otherwise later assertions would be rate
 * limited by earlier ones and the tests would be order-dependent.
 */
const { buckets } = require('@/lib/api');

const validContact = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'Ada@Example.COM',
  phone: '+32 478 54 74 75',
  message: 'I would like to book a consultation.',
  // Seconds the visitor spent on the form. Over JSON this arrives as a string,
  // which is exactly how the real client sends it — anything under 2 is a bot.
  _t: '12',
};

beforeEach(() => {
  jest.clearAllMocks();
  buckets.clear();
  prisma.contactMessage.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  prisma.appointment.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  prisma.appointment.findFirst.mockResolvedValue(null);
  prisma.newsletterSubscriber.upsert.mockResolvedValue({ id: 1 });
});

describe('POST /api/contact', () => {
  it('creates a ContactMessage and returns 201', async () => {
    const { status, data } = await callApi(contactHandler, { method: 'POST', body: validContact });

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.contactMessage.create).toHaveBeenCalledTimes(1);

    // E-mail is normalised to lower case for consistent lookups.
    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'ada@example.com', source: 'CONTACT' }),
      }),
    );
  });

  it('returns 422 with a per-field map when validation fails', async () => {
    const { status, data } = await callApi(contactHandler, {
      method: 'POST',
      body: { ...validContact, email: 'nope', message: '' },
    });

    expect(status).toBe(422);
    expect(data.details.email).toMatch(/valid e-mail/i);
    expect(data.details.message).toMatch(/required/i);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('silently accepts a honeypot submission without persisting it', async () => {
    const { status, data } = await callApi(contactHandler, {
      method: 'POST',
      body: { ...validContact, website: 'http://spam.example' },
    });

    // 200 with the normal copy: the bot learns nothing.
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    expect(notifyMessage).not.toHaveBeenCalled();
  });

  it('treats a form completed in under two seconds as a bot', async () => {
    const { status } = await callApi(contactHandler, { method: 'POST', body: { ...validContact, _t: 1 } });

    // `_t` is measured client-side, so it arrives as a string over JSON.
    expect(status).toBe(200);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin post', async () => {
    const { status } = await callApi(contactHandler, {
      method: 'POST',
      body: validContact,
      headers: { host: 'localhost:3005', origin: 'https://evil.example' },
    });

    expect(status).toBe(403);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('answers 405 with an Allow header for GET', async () => {
    const { res } = await callApi(contactHandler, { method: 'GET' });
    expect(res.statusCode).toBe(405);
    expect(res.getHeader('allow')).toBe('POST');
  });

  it('sends a notification without blocking the response', async () => {
    await callApi(contactHandler, { method: 'POST', body: validContact });
    expect(notifyMessage).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com' }));
  });
});

describe('POST /api/smile-check', () => {
  const base = { ...validContact, message: '', answers: [1, 4, 7] };

  it('stores the ticked question ids', async () => {
    const { status, data } = await callApi(smileCheckHandler, { method: 'POST', body: base });

    expect(status).toBe(201);
    expect(data.message).toMatch(/3 concerns/);
    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'SMILE_CHECK', smileCheckAnswers: '1,4,7' }),
      }),
    );
  });

  it('accepts a submission with no ticked questions and no message', async () => {
    const { status } = await callApi(smileCheckHandler, {
      method: 'POST',
      body: { ...base, answers: [] },
    });
    expect(status).toBe(201);
  });
});

describe('POST /api/request-info', () => {
  it('maps the portfolio topic onto the right source', async () => {
    await callApi(requestInfoHandler, {
      method: 'POST',
      body: { ...validContact, topic: 'portfolio' },
    });

    expect(prisma.contactMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: 'PORTFOLIO_REQUEST' }) }),
    );
  });

  it('requires a phone number on this form', async () => {
    const { status } = await callApi(requestInfoHandler, {
      method: 'POST',
      body: { ...validContact, phone: '' },
    });

    expect(status).toBe(422);
  });

  it('rejects a phone number containing letters', async () => {
    const { status, data } = await callApi(requestInfoHandler, {
      method: 'POST',
      body: { ...validContact, phone: 'call me' },
    });

    expect(status).toBe(422);
    expect(data.details.phone).toMatch(/valid phone number/i);
  });
});

describe('POST /api/appointments', () => {
  const booking = {
    ...validContact,
    preferredDate: '2026-12-01',
    type: 'CONSULTATION',
    notes: 'Front tooth.',
  };

  it('creates a PENDING appointment', async () => {
    const { status, data } = await callApi(appointmentsHandler, { method: 'POST', body: booking });

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', source: 'website', userId: null }),
      }),
    );
    expect(notifyAppointment).toHaveBeenCalled();
  });

  it('rejects a malformed date with 422', async () => {
    const { status, data } = await callApi(appointmentsHandler, {
      method: 'POST',
      body: { ...booking, preferredDate: 'next tuesday' },
    });

    expect(status).toBe(422);
    expect(data.details.preferredDate).toMatch(/valid date/i);
  });

  it('refuses a duplicate request from the same address within an hour', async () => {
    prisma.appointment.findFirst.mockResolvedValue({ id: 5 });

    const { status } = await callApi(appointmentsHandler, { method: 'POST', body: booking });

    expect(status).toBe(409);
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/newsletter', () => {
  it('stores the subscriber with an unsubscribe token', async () => {
    const { status } = await callApi(newsletterHandler, {
      method: 'POST',
      body: { email: 'Reader@Example.com', _t: 12 },
    });

    expect(status).toBe(201);
    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: 'reader@example.com',
          unsubscribeToken: expect.any(String),
        }),
      }),
    );
  });

  it('rejects an invalid address', async () => {
    const { status } = await callApi(newsletterHandler, {
      method: 'POST',
      body: { email: 'not-an-email', _t: 12 },
    });
    expect(status).toBe(422);
  });
});