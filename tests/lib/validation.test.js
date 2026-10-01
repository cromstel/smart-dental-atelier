const {
  contactSchema,
  smileCheckSchema,
  appointmentSchema,
  serviceSchema,
  gallerySchema,
  settingSchema,
  pageSchema,
} = require('@/lib/validation');

/** Field-level validation is the first line of defence for every form. */
describe('validation schemas', () => {
  describe('contactSchema', () => {
    const valid = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      message: 'Hello there.',
    };

    it('accepts a minimal valid payload', () => {
      expect(contactSchema.parse(valid)).toMatchObject({ email: 'ada@example.com' });
    });

    it('normalises the e-mail to lower case', () => {
      expect(contactSchema.parse({ ...valid, email: 'Ada@Example.COM' }).email).toBe('ada@example.com');
    });

    it('trims surrounding whitespace', () => {
      const parsed = contactSchema.parse({ ...valid, firstName: '  Ada  ' });
      expect(parsed.firstName).toBe('Ada');
    });

    it('rejects an invalid e-mail', () => {
      expect(() => contactSchema.parse({ ...valid, email: 'nope' })).toThrow();
    });

    it('requires a message', () => {
      expect(() => contactSchema.parse({ ...valid, message: '' })).toThrow();
    });

    it('accepts Belgian phone formats with spaces, dots and a plus', () => {
      expect(contactSchema.parse({ ...valid, phone: '+32 478 54 74 75' }).phone).toBe('+32 478 54 74 75');
      expect(contactSchema.parse({ ...valid, phone: '0478.54.74.75' }).phone).toBe('0478.54.74.75');
    });

    it('rejects a phone number containing letters', () => {
      expect(() => contactSchema.parse({ ...valid, phone: 'call me' })).toThrow();
    });

    it('caps the message length so a single field cannot be abused', () => {
      expect(() => contactSchema.parse({ ...valid, message: 'x'.repeat(4001) })).toThrow();
    });
  });

  describe('smileCheckSchema', () => {
    it('allows an empty message and coerces answer ids to numbers', () => {
      const parsed = smileCheckSchema.parse({
        firstName: 'Ada',
        lastName: 'L',
        email: 'ada@example.com',
        message: '',
        answers: ['1', '3'],
      });

      expect(parsed.answers).toEqual([1, 3]);
      expect(parsed.message).toBeFalsy();
    });

    it('validates the optional phone the same way the browser does', () => {
      expect(() =>
        smileCheckSchema.parse({
          firstName: 'Ada',
          lastName: 'L',
          email: 'ada@example.com',
          phone: 'call me',
        }),
      ).toThrow();
    });

    it('defaults answers to an empty array', () => {
      const parsed = smileCheckSchema.parse({
        firstName: 'Ada',
        lastName: 'L',
        email: 'ada@example.com',
      });
      expect(parsed.answers).toEqual([]);
    });
  });

  describe('appointmentSchema', () => {
    const base = {
      firstName: 'Ada',
      lastName: 'L',
      email: 'ada@example.com',
      preferredDate: '2026-12-01',
    };

    it('parses a yyyy-mm-dd date', () => {
      const parsed = appointmentSchema.parse(base);
      expect(parsed.preferredDate).toBeInstanceOf(Date);
      expect(parsed.type).toBe('CONSULTATION');
    });

    it('rejects a free-text date', () => {
      expect(() => appointmentSchema.parse({ ...base, preferredDate: 'next tuesday' })).toThrow();
    });

    it('rejects an unknown appointment type', () => {
      expect(() => appointmentSchema.parse({ ...base, type: 'TELEPORTATION' })).toThrow();
    });

    it('treats an empty serviceId as absent', () => {
      expect(appointmentSchema.parse({ ...base, serviceId: '' }).serviceId).toBeUndefined();
    });
  });

  describe('serviceSchema', () => {
    it('requires a lowercase, hyphenated slug', () => {
      expect(serviceSchema.parse({ slug: 'ceramic-veneers', title: 'T', summary: 'S', description: 'D' }).slug).toBe(
        'ceramic-veneers',
      );
      expect(() =>
        serviceSchema.parse({ slug: 'Ceramic Veneers', title: 'T', summary: 'S', description: 'D' }),
      ).toThrow();
      expect(() => serviceSchema.parse({ slug: 'ceramic_veneers', title: 'T', summary: 'S', description: 'D' })).toThrow();
    });
  });

  describe('gallerySchema', () => {
    it('requires alt text (WCAG 1.1.1)', () => {
      expect(() => gallerySchema.parse({ url: '/images/a.jpg', altText: '' })).toThrow();
      expect(gallerySchema.parse({ url: '/images/a.jpg', altText: 'Patient smile after treatment' }).altText).toBeTruthy();
    });

    it('defaults the category to portfolio', () => {
      expect(gallerySchema.parse({ url: '/a.jpg', altText: 'x' }).category).toBe('portfolio');
    });

    it('rejects a category with unexpected characters', () => {
      expect(() => gallerySchema.parse({ url: '/a.jpg', altText: 'x', category: 'a b' })).toThrow();
    });
  });

  describe('settingSchema', () => {
    it('only allows safe key characters', () => {
      expect(settingSchema.parse({ key: 'contact.email', value: 'a@b.co' }).key).toBe('contact.email');
      expect(() => settingSchema.parse({ key: 'rm -rf /', value: 'x' })).toThrow();
    });
  });

  describe('pageSchema', () => {
    it('applies safe defaults', () => {
      const parsed = pageSchema.parse({ title: 'About', description: 'About us.' });
      expect(parsed.noIndex).toBe(false);
      expect(parsed.published).toBe(true);
    });
  });
});