import { mongoClient } from "@/lib/mongodb";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

const googleProvider = Google({
  clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
  clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
  allowDangerousEmailAccountLinking: true,
}) as unknown as any;

const facebookProvider = Facebook({
  clientId: process.env["FACEBOOK_CLIENT_ID"] ?? "",
  clientSecret: process.env["FACEBOOK_CLIENT_SECRET"] ?? "",
  allowDangerousEmailAccountLinking: true,
}) as unknown as any;

// Configuration NextAuth
const authConfig: any = {
  providers: [
    googleProvider,
    facebookProvider,
    // Credentials provider for email/password login
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async credentials => {
        try {
          const email = String((credentials as any)?.email || "").toLowerCase();
          const password = String((credentials as any)?.password || "");
          if (!email || !password) return null;

          const client = await mongoClient;
          const db = client.db();
          const users = db.collection("users");
          const user = await users.findOne({ email });
          if (!user) return null;

          // Check password
          const valid = await bcrypt.compare(password, user["password"] ?? "");
          if (!valid) return null;

          // Optional: enforce active status
          const status = user["status"] ?? "ACTIVE";
          if (status !== "ACTIVE") return null;

          // Return a minimal user object for the JWT callback
          return {
            id: String(user._id),
            email: user["email"],
            name:
              user["name"] ||
              `${user["firstName"] ?? ""} ${user["lastName"] ?? ""}`.trim(),
          } as any;
        } catch (e) {
          console.error("[AUTH][credentials][authorize] error:", e);
          return null;
        }
      },
    }) as unknown as any,
  ],
  session: { strategy: "jwt" },
  secret: (process.env["AUTH_SECRET"] ??
    process.env["NEXTAUTH_SECRET"]) as string,
  callbacks: {
    async signIn({ user, account, profile }: { user: any, account: any, profile: any }) {
      const debug = (process.env["AUTH_DEBUG"] ?? "").toLowerCase();
      if (debug === "true") {
        console.log("[AUTH][signIn] user=", user);
        console.log("[AUTH][signIn] account=", account);
        console.log("[AUTH][signIn] profile=", profile);
      }

      // Vérifier si l'utilisateur existe déjà
      try {
        const client = await mongoClient;
        const db = client.db();
        const users = db.collection("users");

        const existingUser = await users.findOne({
          email: user.email?.toLowerCase(),
        });

        if (existingUser) {
          // L'utilisateur existe, vérifier s'il a déjà ce provider
          const accounts = db.collection("accounts");
          const existingAccount = await accounts.findOne({
            userId: String(existingUser._id),
            provider: account?.provider,
          });

          if (!existingAccount && account) {
            // Ajouter le nouveau compte
            await accounts.insertOne({
              userId: String(existingUser._id),
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            });
          }
        } else {
          // Créer un nouvel utilisateur
          const newUser = {
            email: user.email?.toLowerCase(),
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "ACTIVE",
          };

          const result = await users.insertOne(newUser);
          const userId = String(result.insertedId);

          // Ajouter le compte
          if (account) {
            const accounts = db.collection("accounts");
            await accounts.insertOne({
              userId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            });
          }
        }
      } catch (error) {
        console.error("[AUTH][signIn] error:", error);
        return false;
      }

      return true;
    },
    async jwt({ token, user, account, profile }: { token: any, user: any, account: any, profile: any }) {
      const debug = (process.env["AUTH_DEBUG"] ?? "").toLowerCase();
      if (debug === "true") {
        console.log("[AUTH][jwt] token=", token);
        console.log("[AUTH][jwt] user=", user);
        console.log("[AUTH][jwt] account=", account);
        console.log("[AUTH][jwt] profile=", profile);
      }

      // Premier appel (connexion)
      if (user && account) {
        (token as any).provider = account.provider;
        (token as any).providerAccountId = account.providerAccountId;
        (token as any).userId = user.id;
        (token as any).email = user.email;
        (token as any).name = user.name;
        (token as any).picture = user.image;
      }

      // Appels suivants (refresh)
      if (token && !(token as any).userId) {
        try {
          const client = await mongoClient;
          const db = client.db();
          const users = db.collection("users");
          const user = await users.findOne({
            email: (token as any).email?.toLowerCase(),
          });
          if (user) {
            (token as any).userId = String(user._id);
            (token as any).email = user["email"];
            (token as any).name = user["name"];
            (token as any).picture = user["image"];
          }
        } catch (error) {
          console.error("[AUTH][jwt] error fetching user:", error);
        }
      }

      // Debug
      if (debug === "true") {
        console.log("[AUTH][jwt] final token=", {
          email: (token as any).email,
          name: (token as any).name,
          provider: (token as any).provider,
          providerAccountId: (token as any).providerAccountId,
          userId: (token as any).userId,
        });
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      // Renvoyer les données enrichies au client
      (session as any).provider = (token as any).provider;
      (session as any).providerAccountId = (token as any).providerAccountId;
      if (session.user) {
        session.user.email = (token as any).email ?? session.user.email;
        session.user.name = (token as any).name ?? (session.user as any).name;
        (session.user as any).id =
          (token as any).userId ?? (session.user as any).id;
        session.user.image = (token as any).picture ?? session.user.image;
        // Indiquer les liaisons éventuelles (utile pour les settings UI)
        (session as any).linkedProviders =
          (session as any).linkedProviders || {};
      }
      const debug = (process.env["AUTH_DEBUG"] ?? "").toLowerCase() === "true";
      if (debug) {
        console.log("[AUTH][session] session=", {
          user: session.user,
          provider: (session as any).provider,
          providerAccountId: (session as any).providerAccountId,
        });
      }
      return session;
    },
  },
};

// Ajouter l'adapter seulement si MongoDB est disponible et pas en mode build
if (
  process.env.NODE_ENV === "production" &&
  process.env["MONGODB_URI"] &&
  !process.env["NEXT_PHASE"]
) {
  (authConfig as any).adapter = MongoDBAdapter(
    mongoClient as unknown as Promise<any>
  );
}

// Pour résoudre le problème des "export const ..." à l'intérieur d'un bloc conditionnel,
// on détermine dynamiquement les handlers ici, puis on exporte en dehors de tout bloc.
let getHandler: (() => Response) | ((req: Request) => Promise<Response>);
let postHandler: (() => Response) | ((req: Request) => Promise<Response>);

if (process.env["NEXT_PHASE"] === "phase-production-build") {
  console.warn("NextAuth désactivé pendant le build");
  getHandler = () =>
    new Response("NextAuth disabled during build", { status: 503 });
  postHandler = () =>
    new Response("NextAuth disabled during build", { status: 503 });
} else {
  // Configuration normale de NextAuth
  const handlers = NextAuth(authConfig as any);
  getHandler = handlers.GET as unknown as typeof getHandler;
  postHandler = handlers.POST as unknown as typeof postHandler;
}



// Exports conditionnels pour auth, signIn, signOut
let authHandler: any;
let signInHandler: any;
let signOutHandler: any;

if (process.env["NEXT_PHASE"] === "phase-production-build") {
  authHandler = () => null;
  signInHandler = () => null;
  signOutHandler = () => null;
} else {
  const { auth, signIn, signOut } = NextAuth(authConfig as any);
  authHandler = auth;
  signInHandler = signIn;
  signOutHandler = signOut;
}

export const GET = getHandler;
export const POST = postHandler;
export const auth = authHandler;
export const signIn = signInHandler;
export const signOut = signOutHandler;