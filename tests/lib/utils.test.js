const { serializeDates } = require('@/lib/serialize');
const {
  formatDate,
  formatRelative,
  telHref,
  initials,
  toParagraphs,
  toDateInputValue,
  statusStyle,
  appointmentTypeLabel,
} = require('@/lib/format');
const { pageTitle, organisationJsonLd, PUBLIC_ROUTES, PRIVATE_ROUTE_PREFIXES } = require('@/lib/seo');

describe('serializeDates', () => {
  it('converts a Date to an ISO string', () => {
    const date = new Date('2026-10-01T09:30:00.000Z');
    expect(serializeDates({ createdAt: date }).createdAt).toBe('2026-10-01T09:30:00.000Z');
  });

  it('walks nested arrays and objects, which is what Prisma returns', () => {
    const input = {
      items: [
        { id: 1, createdAt: new Date('2026-01-01T00:00:00.000Z'), nested: { updatedAt: new Date('2026-02-01T00:00:00.000Z') } },
      ],
    };

    const output = serializeDates(input);

    expect(typeof output.items[0].createdAt).toBe('string');
    expect(typeof output.items[0].nested.updatedAt).toBe('string');
    // The result must survive JSON.stringify, which is exactly what Next does.
    expect(() => JSON.stringify(output)).not.toThrow();
  });

  it('leaves primitives and nulls untouched', () => {
    expect(serializeDates({ a: 1, b: 'two', c: null, d: true })).toEqual({ a: 1, b: 'two', c: null, d: true });
  });

  it('handles BigInt, which Prisma returns for large counters', () => {
    expect(serializeDates({ total: BigInt(9007199254740991n) }).total).toBe(9007199254740991);
  });

  it('unwraps objects exposing toJSON (Prisma Decimal)', () => {
    const decimal = { toJSON: () => '12.50' };
    expect(serializeDates({ price: decimal }).price).toBe('12.50');
  });
});

describe('format helpers', () => {
  it('formats dates for the en-GB audience', () => {
    expect(formatDate('2026-10-01T00:00:00.000Z')).toMatch(/2026/);
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });

  it('formats relative times', () => {
    expect(formatRelative(new Date())).toBe('just now');
    expect(formatRelative(new Date(Date.now() - 3 * 60 * 1000))).toBe('3m ago');
    expect(formatRelative(new Date(Date.now() - 5 * 60 * 60 * 1000))).toBe('5h ago');
    expect(formatRelative(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))).toBe('3d ago');
  });

  it('builds a tel: link from a formatted number', () => {
    expect(telHref('+32 478 54 74 75')).toBe('tel:+32478547475');
    expect(telHref(undefined)).toBeUndefined();
  });

  it('derives initials for avatars', () => {
    expect(initials('Karl')).toBe('K');
    expect(initials('Martin Weron')).toBe('MW');
    expect(initials('')).toBe('');
  });

  it('splits copy into paragraphs on blank lines', () => {
    expect(toParagraphs('One.\n\nTwo.\n\n\nThree.')).toEqual(['One.', 'Two.', 'Three.']);
    expect(toParagraphs('')).toEqual([]);
  });

  it('produces a local yyyy-mm-dd value for date inputs', () => {
    expect(toDateInputValue(new Date(2026, 9, 1))).toBe('2026-10-01');
  });

  it('maps statuses to a label and Tailwind classes', () => {
    expect(statusStyle('PENDING')).toEqual({
      label: 'Pending',
      className: expect.stringContaining('text-warning'),
    });
    expect(statusStyle('SOMETHING_NEW').label).toBe('something new');
  });

  it('labels appointment types', () => {
    expect(appointmentTypeLabel('CUSTOM_SHADING')).toBe('Custom colour shading');
    expect(appointmentTypeLabel('UNKNOWN')).toBe('Consultation');
  });
});

describe('seo helpers', () => {
  it('appends the brand name unless the title already has it', () => {
    expect(pageTitle('Services')).toBe('Services | Dental Atelier');
    expect(pageTitle('About – Dental Atelier')).toBe('About – Dental Atelier');
    expect(pageTitle()).toBe('Dental Atelier');
  });

  it('produces DentalLab structured data with the real address', () => {
    const jsonLd = organisationJsonLd({
      name: 'Dental Atelier',
      legalName: 'Dental Atelier Michal Siakel',
      url: 'https://www.dentalatelier.co',
      phone: '+32 2 376 43 26',
      vat: 'BE 0504872627',
      address: { street: 'Rue du Bourdon 100/8', postalCode: '1180', city: 'Uccle', countryCode: 'BE' },
    });

    expect(jsonLd['@type']).toBe('DentalLab');
    expect(jsonLd.address.streetAddress).toBe('Rue du Bourdon 100/8');
    expect(jsonLd.vatID).toBe('BE 0504872627');
  });

  it('lists every marketing page in the sitemap', () => {
    const paths = PUBLIC_ROUTES.map((route) => route.path);
    expect(paths).toEqual(expect.arrayContaining(['/', '/faqs', '/portfolio', '/contact-us', '/book-appointment']));
    // No private route may leak into the sitemap.
    expect(paths.some((path) => PRIVATE_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix)))).toBe(false);
  });
});