/** Small formatting helpers shared by the portals. */

const DATE_LOCALE = 'en-GB';

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Relative label used in the admin dashboard ("3 days ago"). */
export function formatRelative(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return `${months}mo ago`;

  return `${Math.round(months / 12)}y ago`;
}

/** `+32478547475` / `+32 478 54 74 75` -> `tel:+32478547475` */
export function telHref(phone) {
  if (!phone) return undefined;
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

/** Split a `\n\n` separated string into paragraphs. */
export function toParagraphs(body = '') {
  return String(body)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/** `yyyy-mm-dd` for `<input type="date">`, in local time (not UTC). */
export function toDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Human label + Tailwind classes for the status pills. */
export const STATUS_STYLES = {
  PENDING: { label: 'Pending', className: 'bg-warning/15 text-warning border-warning/40' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-success/15 text-success border-success/40' },
  COMPLETED: { label: 'Completed', className: 'bg-accent-400/15 text-accent-300 border-accent-400/40' },
  CANCELLED: { label: 'Cancelled', className: 'bg-error-400/15 text-error-300 border-error-400/40' },
  NO_SHOW: { label: 'No show', className: 'bg-ink-600 text-silver-400 border-ink-400' },
  NEW: { label: 'New', className: 'bg-warning/15 text-warning border-warning/40' },
  READ: { label: 'Read', className: 'bg-accent-400/15 text-accent-300 border-accent-400/40' },
  ANSWERED: { label: 'Answered', className: 'bg-success/15 text-success border-success/40' },
  SPAM: { label: 'Spam', className: 'bg-ink-600 text-silver-500 border-ink-400' },
  PUBLISHED: { label: 'Published', className: 'bg-success/15 text-success border-success/40' },
  DRAFT: { label: 'Draft', className: 'bg-ink-600 text-silver-400 border-ink-400' },
  ACTIVE: { label: 'Active', className: 'bg-success/15 text-success border-success/40' },
  INACTIVE: { label: 'Inactive', className: 'bg-error-400/15 text-error-300 border-error-400/40' },
};

export function statusStyle(status) {
  return (
    STATUS_STYLES[status] || {
      label: String(status || 'Unknown').replace(/_/g, ' ').toLowerCase(),
      className: 'bg-ink-600 text-silver-400 border-ink-400',
    }
  );
}

export const APPOINTMENT_TYPES = [
  { value: 'CONSULTATION', label: 'Free consultation' },
  { value: 'CUSTOM_SHADING', label: 'Custom colour shading' },
  { value: 'FACIAL_ANALYSIS', label: 'Facial analysis' },
  { value: 'SMILE_DESIGN', label: 'Digital smile design' },
  { value: 'TREATMENT', label: 'Treatment coordination' },
  { value: 'OTHER', label: 'Something else' },
];

export function appointmentTypeLabel(value) {
  return APPOINTMENT_TYPES.find((type) => type.value === value)?.label || 'Consultation';
}