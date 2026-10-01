import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

/**
 * `/api/auth/[...nextauth]` — the NextAuth route handler.
 *
 * The configuration itself lives in `lib/authOptions.js` so that the
 * `getServerSession()` calls in `lib/guards.js` and `lib/api.js` use the exact
 * same callbacks.
 */
export default NextAuth(authOptions);