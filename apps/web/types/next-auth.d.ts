import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: DefaultSession['user'] & {
      id: string;
      role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    };
  }

  interface User {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    accessToken?: string;
  }
}
