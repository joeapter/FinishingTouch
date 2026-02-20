import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { credentialsSchema, roleSchema } from '@finishing-touch/shared';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          return null;
        }

        const response = await fetch(
          `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          },
        );

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          access_token: string;
          user: {
            id: string;
            email: string | null;
            user_metadata?: { role?: unknown };
          };
        };

        if (!data.access_token || !data.user?.email) {
          return null;
        }

        const maybeRole = roleSchema.safeParse(data.user.user_metadata?.role);

        return {
          id: data.user.id,
          email: data.user.email,
          role: maybeRole.success ? maybeRole.data : 'ADMIN',
          accessToken: data.access_token,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.email = token.email || '';
        session.user.role =
          (token.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | undefined) ||
          'EMPLOYEE';
      }
      session.accessToken = (token.accessToken as string | undefined) || '';

      return session;
    },
    authorized: async ({ auth, request }) => {
      const pathname = request.nextUrl.pathname;

      if (!pathname.startsWith('/admin')) {
        return true;
      }

      if (pathname === '/admin/login') {
        return true;
      }

      return Boolean(auth?.user);
    },
  },
});
