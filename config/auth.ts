import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
          // Ici vous intégreriez votre logique d'authentification avec MongoDB
          // Pour l'instant, on simule une authentification

          // Exemple de vérification (à adapter selon votre modèle User)
          /*
          const user = await User.findOne({ email: credentials.email });
          if (!user) return null;
          
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) return null;
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
          */

          // Simulation temporaire
          if (
            credentials.email === "admin@diaspomoney.fr" &&
            credentials.password === "admin123"
          ) {
            return {
              id: "1",
              email: "admin@diaspomoney.fr",
              name: "Admin DiaspoMoney",
              role: "admin",
            };
          }

          return null;
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
    secret: process.env.JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
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
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};

// Configuration JWT personnalisée
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  algorithm: "HS256" as const,
  expiresIn: "30d",
  issuer: "diaspomoney",
  audience: "diaspomoney-users",
};

// Types pour TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
