import { z } from 'zod';

/** Trimmed, non-empty string with a sane upper bound. */
const text = (max = 500, label = 'This field') =>
  z
    .string({ required_error: `${label} is required.`, invalid_type_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal('').transform(() => undefined));

const email = z
  .string({ required_error: 'E-mail is required.' })
  .trim()
  .min(1, 'E-mail is required.')
  .max(191, 'E-mail is too long.')
  .email('Please enter a valid e-mail address.')
  .transform((value) => value.toLowerCase());

/**
 * Belgian numbers are written with spaces or dots: "+32 478 54 74 75".
 * Normalised to digits for tel: links while keeping the display format.
 */
const phone = z
  .string({ required_error: 'Phone is required.' })
  .trim()
  .min(6, 'Please enter a valid phone number.')
  .max(40)
  .regex(/^[+0-9][0-9\s./-]*$/, 'Please enter a valid phone number.');

/**
 * Optional phone. Same character rules as `phone` so the server rejects what
 * the client-side `phoneRule` rejects — otherwise the two drift apart and junk
 * ends up in the CRM.
 */
const optionalPhone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[+0-9][0-9\s./-]{5,}$/, 'Please enter a valid phone number.')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const contactSchema = z.object({
  firstName: text(80, 'First name'),
  lastName: text(80, 'Surname'),
  email,
  phone: optionalPhone,
  message: text(4000, 'Your enquiry'),
  /** Honeypot: must stay empty. */
  website: z.string().optional(),
  referrer: optionalText(200),
});

export const smileCheckSchema = contactSchema.extend({
  message: optionalText(4000),
  /** Ids of the ticked questions. */
  answers: z.array(z.coerce.number().int()).max(50).optional().default([]),
});

export const requestInfoSchema = z.object({
  firstName: text(80, 'First name'),
  lastName: text(80, 'Surname'),
  email,
  phone: phone,
  message: optionalText(2000),
  /** Which page/section the form was on. */
  topic: optionalText(120),
  website: z.string().optional(),
});

export const appointmentSchema = z.object({
  firstName: text(80, 'First name'),
  lastName: text(80, 'Surname'),
  email,
  phone: phone.optional().or(z.literal('').transform(() => undefined)),
  /** ISO date string (yyyy-mm-dd) or full ISO datetime. */
  // Two separate rules rather than transform+refine: chaining a `.transform()`
  // into `.refine()` makes the callback run against the pre-transform value,
  // so `date.getTime()` would receive the raw string and throw a TypeError
  // instead of producing a clean validation error.
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/, 'Please choose a valid date.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Please choose a valid date.')
    .transform((value) => new Date(value)),
  type: z
    .enum(['CONSULTATION', 'CUSTOM_SHADING', 'FACIAL_ANALYSIS', 'SMILE_DESIGN', 'TREATMENT', 'OTHER'])
    .optional()
    .default('CONSULTATION'),
  // The optional select posts '' when nothing is chosen. `z.coerce.number()`
  // would turn '' into 0, so the empty string is mapped to undefined first and
  // only real values reach the integer coercion.
  serviceId: z
    .preprocess((value) => (value === '' || value === null ? undefined : value), z.coerce.number().int().positive().optional()),
  notes: optionalText(4000),
  website: z.string().optional(),
});

export const testimonialSchema = z.object({
  author: text(80, 'Author'),
  treatment: optionalText(120),
  quote: text(2000, 'Quote'),
  image: optionalText(300),
  order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const faqSchema = z.object({
  question: text(300, 'Question'),
  answer: text(8000, 'Answer'),
  category: z
    .enum(['GENERAL', 'VENEERS', 'CROWNS_BRIDGES', 'IMPLANTS', 'TREATMENT', 'COST'])
    .optional()
    .default('GENERAL'),
  order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const serviceSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
  title: text(160, 'Title'),
  summary: text(600, 'Summary'),
  description: text(8000, 'Description'),
  category: z.enum(['product', 'service']).optional().default('product'),
  image: optionalText(300),
  priceFrom: optionalText(40),
  order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const gallerySchema = z.object({
  title: optionalText(160),
  url: text(500, 'Image'),
  altText: text(300, 'Alt text'),
  category: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Category must be lowercase words separated by hyphens.')
    .optional()
    .default('portfolio'),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  published: z.boolean().optional().default(true),
});

export const pageBlockSchema = z.object({
  type: z.enum([
    'hero',
    'rich-text',
    'cards',
    'gallery',
    'faq-accordion',
    'contact-form',
    'cta',
    'testimonial-slider',
    'map',
    'smile-check',
    'timeline',
  ]),
  title: optionalText(200),
  subtitle: optionalText(300),
  body: optionalText(20000),
  position: z.coerce.number().int().min(0).max(999).optional().default(0),
  published: z.boolean().optional().default(true),
  data: z.any().optional(),
});

export const pageSchema = z.object({
  title: text(191, 'Title'),
  description: text(500, 'Description'),
  heading: optionalText(200),
  image: optionalText(300),
  noIndex: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
});

export const settingSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Key may only contain letters, numbers, dots, dashes and underscores.'),
  value: z.string().max(20000),
  group: z.string().trim().max(40).optional().default('general'),
});

export const messageStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'ANSWERED', 'SPAM']),
  repliedAt: z.coerce.date().optional(),
});

export const userSchema = z.object({
  name: optionalText(120),
  email,
  phone: optionalText(40),
  role: z.enum(['ADMIN', 'CLIENT']),
  isActive: z.boolean().optional().default(true),
  /** Only honoured on create, or when an admin resets their own password. */
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters.')
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

/**
 * Client-portal profile update.
 *
 * Deliberately narrower than `userSchema`: it has no `role`, so a client
 * cannot send their way into the admin portal even if the route failed to
 * strip the field.
 */
export const profileSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email,
  phone: optionalText(40),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters.')
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.').max(200),
  callbackUrl: optionalText(300),
});

/** Best-effort coercion of JSON booleans/numbers coming from form posts. */
export function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'on', 'yes'].includes(String(value).toLowerCase());
}

export { text, optionalText, email, phone, optionalPhone };