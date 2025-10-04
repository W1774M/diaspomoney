import { mongoClient } from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: MongoDBAdapter(mongoClient as unknown as Promise<any>),
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
    async signIn({ user, account, profile }) {
      const debug = (process.env["AUTH_DEBUG"] ?? "").toLowerCase() === "true";
      if (debug) {
        console.log("[AUTH][signIn] provider=", account?.provider);
        console.log(
          "[AUTH][signIn] providerAccountId=",
          account?.providerAccountId
        );
        console.log("[AUTH][signIn] email=", profile && (profile as any).email);
        console.log("[AUTH][signIn] name=", profile && (profile as any).name);
      }
      // Exiger qu'un utilisateur existe déjà avec cet email
      try {
        const email = (profile as any)?.email || (user as any)?.email;
        if (!email) return false;
        const client = await mongoClient;
        const db = client.db();
        const users = db.collection("users");
        const existing = await users.findOne({
          email: String(email).toLowerCase(),
        });
        if (!existing) {
          const baseUrl =
            (process.env["NEXTAUTH_URL"] as string) || "http://localhost:3000";
          const provider = account?.provider || "oauth";
          const callbackParams = new URLSearchParams({
            oauth: provider,
            email: email,
          });
          if (account?.providerAccountId) {
            callbackParams.set("providerAccountId", account.providerAccountId);
          }
          if ((profile as any)?.name) {
            callbackParams.set("name", String((profile as any).name));
          }
          if ((profile as any)?.picture) {
            callbackParams.set("image", String((profile as any).picture));
          }
          const redirectUrl = `${baseUrl}/register?${callbackParams.toString()}`;
          if (debug)
            console.log(
              "[AUTH][signIn] Email inconnu → redirection vers:",
              redirectUrl
            );
          return redirectUrl;
        }
        // Marquer le user comme lié au provider si pas encore fait
        const provider = account?.provider;
        const update: any = { $set: { lastLogin: new Date() } };
        if (provider === "google") {
          update.$set["oauth.google.linked"] = true;
          update.$set["oauth.google.providerAccountId"] =
            account?.providerAccountId;
          if ((profile as any)?.email_verified === true) {
            update.$set["emailVerified"] = true;
          }
        }
        if (provider === "facebook") {
          update.$set["oauth.facebook.linked"] = true;
          update.$set["oauth.facebook.providerAccountId"] =
            account?.providerAccountId;
        }
        await users.updateOne({ _id: existing._id }, update);
        // Notification simple côté serveur
        console.log(`[AUTH] Connexion réussie via ${provider} pour ${email}`);
        // Autoriser et laisser NextAuth rediriger selon callbackUrl
        return true;
      } catch (e) {
        console.error(
          "[AUTH][signIn] erreur lors de la vérification/liaison:",
          e
        );
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      // Enrichir le token avec les informations utiles
      if (account) {
        token["provider"] = account.provider;
        token["providerAccountId"] = account.providerAccountId;
      }
      if (user) {
        token["userId"] =
          (user as any).id ?? (user as any)._id ?? token["userId"];
      }
      if (profile) {
        const p: any = profile;
        token.email = p.email ?? token.email;
        token.name = p.name ?? token.name;
        token.picture = p.picture ?? p.avatar_url ?? token.picture;
      }
      const debug = (process.env["AUTH_DEBUG"] ?? "").toLowerCase() === "true";
      if (debug) {
        console.log("[AUTH][jwt] token=", {
          provider: (token as any).provider,
          providerAccountId: (token as any).providerAccountId,
          email: (token as any).email,
          name: (token as any).name,
          userId: (token as any).userId,
        });
      }
      return token;
    },
    async session({ session, token }) {
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
});
