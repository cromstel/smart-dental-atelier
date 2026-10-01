/**
 * JSON-safe conversion for `getStaticProps` / `getServerSideProps`.
 *
 * Next.js refuses to serialise `Date` (and Prisma's `Decimal` / `BigInt`)
 * into page props — it throws "Error serializing ... returned from
 * getStaticProps" at build time. Every page that reads rows straight from
 * Prisma must run its props through `serializeDates`.
 */
export function serializeDates(input) {
  if (input === null || input === undefined) return input;

  if (input instanceof Date) return input.toISOString();

  // BigInt
  if (typeof input === 'bigint') return Number(input);

  // Prisma Decimal / objects with toJSON
  if (typeof input === 'object' && typeof input.toJSON === 'function') {
    return serializeDates(input.toJSON());
  }

  if (Array.isArray(input)) return input.map(serializeDates);

  if (input instanceof Map) {
    return Object.fromEntries([...input.entries()].map(([k, v]) => [k, serializeDates(v)]));
  }

  if (input instanceof Set) return [...input].map(serializeDates);

  if (typeof input === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = serializeDates(value);
    }
    return out;
  }

  return input;
}

export default serializeDates;