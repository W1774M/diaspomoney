import { NextAuthJWT, NextAuthSession, NextAuthUser } from "@/lib/definitions";
import User from "@/models/User";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDatabase } from "./database";

// Configuration NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDatabase();

          // Recherche de l'utilisateur
          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          });
          if (!user) {
            return null;
          }

          // Vérification du mot de passe
          const isValidPassword = await user.comparePassword(
            credentials.password
          );
          if (!isValidPassword) {
            return null;
          }

          // Vérification de l'email (optionnel)
          if (!user.isEmailVerified) {
            // Vous pouvez choisir de bloquer ou non les utilisateurs non vérifiés
            // throw new Error("Email non vérifié");
          }

          // Mise à jour de la dernière connexion
          user.lastLogin = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  jwt: {
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  callbacks: {
    async jwt({ token, user }) {
      console.log("NextAuth JWT Callback - Token:", token);
      console.log("NextAuth JWT Callback - User:", user);

      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isEmailVerified = user.isEmailVerified;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
      }
      return token;
    },

    async session({ session, token }) {
      console.log("NextAuth Session Callback - Session:", session);
      console.log("NextAuth Session Callback - Token:", token);

      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isEmailVerified =
          token.isEmailVerified as boolean;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).phone = token.phone as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("NextAuth Redirect Callback - URL:", url);
      console.log("NextAuth Redirect Callback - BaseURL:", baseUrl);

      // Redirection après connexion
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

// Configuration JWT personnalisée
export const jwtConfig = {
  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  algorithm: "HS256" as const,
  expiresIn: "30d",
  issuer: "diaspomoney",
  audience: "diaspomoney-users",
};

// Types pour TypeScript
declare module "next-auth" {
  interface Session extends NextAuthSession {}
  interface User extends NextAuthUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {}
}
