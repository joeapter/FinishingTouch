import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { credentialsSchema } from '@finishing-touch/shared';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed.data),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          accessToken: string;
          user: { id: string; email: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' };
        };

        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.accessToken,
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
