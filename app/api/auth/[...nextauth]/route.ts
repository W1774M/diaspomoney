import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// @ts-ignore
const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Fix session callback types
      session.accessToken = token.accessToken;
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    // Remove signUp as it's not a valid option
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
