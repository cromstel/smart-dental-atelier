import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { authorizeCredentials } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { withWriteRetry } from '@/lib/auth';

/**
 * Single source of truth for the NextAuth configuration.
 *
 * It lives in its own module rather than inside
 * `pages/api/auth/[...nextauth].js` because NextAuth v4 requires the *same*
 * options object wherever you call `getServerSession()` manually — the session
 * and jwt callbacks are not applied otherwise, so `session.user.id` and
 * `session.user.role` come back `undefined` and every server-side guard treats
 * a signed-in user as anonymous. `lib/guards.js` and `lib/api.js` import this.
 */

const providers = [
  CredentialsProvider({
    id: 'credentials',
    name: 'E-mail and password',
    credentials: {
      email: { label: 'E-mail', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      return authorizeCredentials(credentials || {});
    },
  }),
];

// Google OAuth is only wired up when both variables are present, so a fresh
// clone without them does not crash on a provider with no credentials.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
      async profile(profile) {
        // Google accounts are provisioned as CLIENT. An admin promotes them
        // explicitly from /admin/users — the provider is never trusted for a role.
        if (isDatabaseConfigured && profile.email) {
          try {
            await prisma.user.upsert({
              where: { email: String(profile.email).toLowerCase() },
              update: { name: profile.name || undefined, image: profile.picture || undefined },
              create: {
                email: String(profile.email).toLowerCase(),
                name: profile.name || undefined,
                image: profile.picture || undefined,
                role: 'CLIENT',
                emailVerified: new Date(),
              },
            });
          } catch (error) {
            console.error('[auth] could not sync Google profile:', error.message);
          }
        }
        return { id: profile.sub, email: profile.email, name: profile.name, image: profile.picture };
      },
    }),
  );
}

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  // Required on Next.js 15 behind Vercel / Hostinger proxies, otherwise
  // NextAuth cannot determine the host and refuses to issue cookies.
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  jwt: { maxAge: 60 * 60 * 8 },
  // NextAuth's own fallbacks, for the flows our forms do not use: both pages
  // submit with `redirect: false` and translate the error code themselves, so
  // these only apply to the OAuth callback and `/api/auth/*` redirects. They
  // point at the client page because it is the shared, public one — staff
  // authentication is driven by `/auth/admin/login` and the guard in
  // `lib/guards.js`, never by NextAuth's redirects.
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    /** Copy the role onto the token at sign-in. */
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'CLIENT';
        token.uid = user.id ? String(user.id) : token.sub;
      }
      return token;
    },

    /** Expose id + role on `session.user` for the portals and the guards. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid || token.sub;
        session.user.role = token.role || 'CLIENT';
      }
      return session;
    },
  },
  events: {
    /** Record sign-ins for the "active clients" dashboard metric. */
    async signIn({ user, account }) {
      if (!isDatabaseConfigured || !user?.email) return;
      try {
        // `authorize` also stamps lastLoginAt on the same row, so this write
        // can race it — retry on the transient MariaDB 1020.
        await withWriteRetry(() =>
          prisma.user.updateMany({
            where: { email: String(user.email).toLowerCase() },
            data: { lastLoginAt: new Date() },
          }),
        );
      } catch (error) {
        console.error('[auth] signIn event failed:', error.message);
      }
      return account?.provider ?? null;
    },
  },
  debug: false,
};

export default authOptions;