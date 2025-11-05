// Configuration NextAuth simplifiée pour le build
import NextAuth from 'next-auth';

const authConfig = NextAuth({
  debug: false,
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-for-build',
  pages: {
    signIn: '/login',
    error: '/error',
    verifyRequest: '/verify-request',
    newUser: '/register',
  },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token['id'] = user.id;
        token['email'] = user.email as string | null;
        token['name'] = user.name as string | null;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (token && session.user) {
        (session.user as typeof session.user & { id?: string }).id = token['id'] as string;
        (session.user as typeof session.user & { email?: string | null }).email = token['email'] as string | null;
        (session.user as typeof session.user & { name?: string | null }).name = token['name'] as string | null;
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = authConfig;
