import { authEvents } from "@/lib/events";
import { mongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export const authConfig: NextAuthOptions = {
  
  providers: [
    GoogleProvider({
      clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env["FACEBOOK_CLIENT_ID"] ?? "",
      clientSecret: process.env["FACEBOOK_CLIENT_SECRET"] ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials?: Record<"email" | "password", string>): Promise<{ id: string; email: string; name: string; image: string | null } | null> {
        try {
          console.log("[AUTH][credentials][authorize] ========== START ==========");
          
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH][credentials][authorize] Missing email or password");
            return null;
          }
          
          const email = String(credentials.email).toLowerCase();
          const password = String(credentials.password);

          console.log("[AUTH][credentials][authorize] Attempting login for:", email);
          const client = await mongoClient;
          const db = client.db();
          const users = db.collection("users");
          const user = await users.findOne({ email });
          
          if (!user) {
            console.log("[AUTH][credentials][authorize] User not found:", email);
            return null;
          }

          console.log("[AUTH][credentials][authorize] User found, checking password...");
          
          // Vérifier que le mot de passe existe et est hashé
          const storedPassword = user["password"];
          if (!storedPassword) {
            console.log("[AUTH][credentials][authorize] No password set for user (OAuth only):", email);
            return null;
          }
          
          // Vérifier que storedPassword n'est pas le mot de passe en clair (sécurité)
          if (storedPassword.length < 20) {
            console.error("[AUTH][credentials][authorize] Password appears to be stored in plain text!");
            return null;
          }
          
          const valid = await bcrypt.compare(password, storedPassword);
          if (!valid) {
            console.log("[AUTH][credentials][authorize] Invalid password for:", email);
            return null;
          }

          const status = user["status"] ?? "ACTIVE";
          if (status !== "ACTIVE") {
            console.log("[AUTH][credentials][authorize] User account is not active. Status:", status);
            return null;
          }

          console.log("[AUTH][credentials][authorize] Authentication successful for:", email);
          
          // Émettre l'événement de connexion réussie
          authEvents.emitUserLoggedIn({
            userId: String(user._id),
            email: user["email"],
            timestamp: new Date(),
          }).catch(error => {
            console.error("[AUTH] Error emitting user logged in event:", error);
          });
          
          // Retourner l'objet user avec toutes les informations nécessaires
          const userObject = {
            id: String(user._id),
            email: user["email"],
            name: user["name"] || `${user["firstName"] ?? ""} ${user["lastName"] ?? ""}`.trim(),
            image: user["image"] || null,
          };
          
          console.log("[AUTH][credentials][authorize] Returning user object:", {
            id: userObject.id,
            email: userObject.email,
            name: userObject.name,
          });
          
          return userObject;
        } catch (e) {
          console.error("[AUTH][credentials][authorize] error:", e);
          return null;
        }
      },
    }),
  ],
  
  pages: {
    signIn: "/login",
  },
  
  callbacks: {
    async signIn({ user, account }: { user: any, account: any, profile?: any }) {
      console.log("[AUTH][signIn] ========== START SIGNIN CALLBACK ==========");
      console.log("[AUTH][signIn] Provider:", account?.provider);
      console.log("[AUTH][signIn] User object:", {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        hasId: !!user?.id,
        hasEmail: !!user?.email,
      });

      try {
        const client = await mongoClient;
        const db = client.db();
        const users = db.collection("users");

        // Pour les connexions OAuth (Google, Facebook)
        if (account?.provider === "google" || account?.provider === "facebook") {
          console.log("[AUTH][signIn] OAuth login detected - checking/creating user");
          
          const email = user.email?.toLowerCase();
          if (!email) {
            console.error("[AUTH][signIn] No email provided by OAuth provider");
            return false;
          }

          const existingUser = await users.findOne({ email });
          
          if (!existingUser) {
            console.log("[AUTH][signIn] Creating new OAuth user");
            const result = await users.insertOne({
              email,
              name: user.name || "",
              image: user.image || "",
              emailVerified: new Date(),
              roles: ["CUSTOMER"],
              status: "ACTIVE",
              createdAt: new Date(),
              updatedAt: new Date(),
              oauth: {
                [account.provider]: {
                  linked: true,
                  providerAccountId: account.providerAccountId,
                }
              }
            });
            user.id = String(result.insertedId);
            console.log("[AUTH][signIn] New OAuth user created with ID:", user.id);
          } else {
            console.log("[AUTH][signIn] Existing user found with ID:", String(existingUser._id));
            await users.updateOne(
              { email },
              { 
                $set: {
                  [`oauth.${account.provider}.linked`]: true,
                  [`oauth.${account.provider}.providerAccountId`]: account.providerAccountId,
                  updatedAt: new Date(),
                  ...(user.image && { image: user.image }),
                  ...(user.name && { name: user.name }),
                }
              }
            );
            user.id = String(existingUser._id);
          }
          
          // Émettre l'événement de connexion réussie pour OAuth
          authEvents.emitUserLoggedIn({
            userId: user.id,
            email: user.email!,
            timestamp: new Date(),
          }).catch(error => {
            console.error("[AUTH] Error emitting user logged in event:", error);
          });
          
          console.log("[AUTH][signIn] OAuth sign in authorized with user.id:", user.id);
          return true;
        }

        // Pour les connexions par credentials
        // Le statut a déjà été vérifié dans authorize(), donc on accepte directement
        if (account?.provider === "credentials") {
          console.log("[AUTH][signIn] Credentials login - user already validated in authorize()");
          
          // Vérifier que l'utilisateur a bien un email et un id
          if (!user.email) {
            console.error("[AUTH][signIn] No email found in user object for credentials");
            return false;
          }
          
          if (!user.id) {
            console.error("[AUTH][signIn] No id found in user object for credentials");
            return false;
          }
          
          console.log("[AUTH][signIn] Credentials sign in authorized for user:", user.email);
          return true;
        }

        return true;
      } catch (error) {
        console.error("[AUTH][signIn] Error:", error);
        return false;
      }
    },
    
    async jwt({ token, user, account }: { token: any, user: any, account: any }) {
      console.log("[AUTH][jwt] ========== START JWT CALLBACK ==========");
      console.log("[AUTH][jwt] Token initial:", {
        hasToken: !!token,
        hasUserId: !!token?.userId,
        hasEmail: !!token?.email,
      });
      console.log("[AUTH][jwt] User:", {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
      });
      console.log("[AUTH][jwt] Account:", {
        hasAccount: !!account,
        provider: account?.provider,
      });
      
      try {
        // Initialiser token s'il n'existe pas
        if (!token) {
          console.warn("[AUTH][jwt] Token est null ou undefined, initialisation...");
          token = {};
        }
        
        // Premier appel (connexion) - l'objet user est présent
        if (user) {
          console.log("[AUTH][jwt] First call - setting token from user");
          token.provider = account?.provider;
          token.providerAccountId = account?.providerAccountId;
          token.userId = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          console.log("[AUTH][jwt] Token userId set to:", token.userId);
        }

        // Si userId n'est toujours pas défini (fallback pour sécurité)
        if (token && !token.userId && token.email) {
          console.log("[AUTH][jwt] UserId missing, fetching from DB by email");
          try {
            const client = await mongoClient;
            const db = client.db();
            const users = db.collection("users");
            const dbUser = await users.findOne({
              email: token.email?.toLowerCase(),
            });
            if (dbUser) {
              console.log("[AUTH][jwt] User found in DB:", String(dbUser._id));
              token.userId = String(dbUser._id);
              token.email = dbUser["email"];
              token.name = dbUser["name"];
              token.picture = dbUser["image"];
            }
          } catch (error) {
            console.error("[AUTH][jwt] error fetching user:", error);
          }
        }

        console.log("[AUTH][jwt] Token final:", {
          userId: token?.userId,
          email: token?.email,
          name: token?.name,
        });
        console.log("[AUTH][jwt] ========== END JWT CALLBACK ==========");
        
        return token;
      } catch (error) {
        console.error("[AUTH][jwt] Erreur dans le callback jwt:", error);
        console.error("[AUTH][jwt] Stack:", error instanceof Error ? error.stack : 'No stack');
        // Retourner le token même en cas d'erreur pour éviter de casser la session
        return token || {};
      }
    },
    
    async session({ session, token }: { session: any, token: any }) {
      try {
        console.log("[AUTH][session] ========== START SESSION CALLBACK ==========");
        console.log("[AUTH][session] Session:", !!session, "Token:", !!token);
        
        // Si pas de session, retourner null (pas de session active)
        // Dans NextAuth v5, retourner null est valide pour indiquer aucune session
        if (!session) {
          console.log("[AUTH][session] Pas de session, retour null");
          return null;
        }
        
        // S'assurer que session.user existe
        if (!session.user) {
          session.user = {};
        }
        
        // Si pas de token ou token vide, retourner session vide mais valide
        if (!token || (!token.email && !token.userId)) {
          console.log("[AUTH][session] Pas de token ou token vide, retour session vide");
          // Retourner une session vide mais valide avec user: null
          return {
            ...session,
            user: null,
            expires: session.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
        
        // Enrichir la session avec les données du token
        if (token.email) {
          session.user.email = token.email;
        }
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.userId) {
          (session.user as any).id = token.userId;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }
        
        // Ajouter les informations du provider
        if (token.provider) {
          (session as any).provider = token.provider;
        }
        if (token.providerAccountId) {
          (session as any).providerAccountId = token.providerAccountId;
        }
        
        console.log("[AUTH][session] Session enrichie avec succès");
        console.log("[AUTH][session] ========== END SESSION CALLBACK ==========");
        
        return session;
      } catch (error) {
        console.error("[AUTH][session] Erreur dans le callback session:", error);
        console.error("[AUTH][session] Stack:", error instanceof Error ? error.stack : 'No stack');
        // Retourner une session vide pour éviter une erreur 500
        try {
          return { user: {} };
        } catch {
          // Si même ça échoue, retourner null
          return null;
        }
      }
    },
    
    async redirect({ url, baseUrl }: { url: string, baseUrl: string }) {
      console.log("[AUTH][redirect] URL demandée:", url);
      console.log("[AUTH][redirect] Base URL:", baseUrl);
      
      // Si l'URL est relative, retourner une URL relative
      if (url && url.startsWith("/")) {
        if (url.startsWith("/dashboard")) {
          console.log("[AUTH][redirect] Redirection relative vers:", url);
          return url;
        }
        console.log("[AUTH][redirect] Redirection par défaut vers /dashboard");
        return "/dashboard";
      }
      
      // Si l'URL est absolue, vérifier qu'elle est sur le bon domaine
      try {
        // Vérifier que url est valide avant de créer l'URL
        if (!url || url.trim() === "") {
          console.warn("[AUTH][redirect] URL vide, redirection vers /dashboard");
          return "/dashboard";
        }
        
        const urlObj = new URL(url);
        
        // Vérifier que baseUrl est valide avant de créer l'URL
        if (!baseUrl || baseUrl.trim() === "") {
          // Si baseUrl est invalide, extraire juste le chemin de l'URL
          console.warn("[AUTH][redirect] Base URL invalide, extraction du chemin:", urlObj.pathname);
          return urlObj.pathname + urlObj.search || "/dashboard";
        }
        
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("[AUTH][redirect] Redirection vers URL autorisée:", url);
          return url;
        }
        
        console.log("[AUTH][redirect] URL externe détectée, extraction du chemin:", urlObj.pathname);
        return urlObj.pathname + urlObj.search;
      } catch (e) {
        console.warn("[AUTH][redirect] URL invalide, redirection vers /dashboard:", e);
        return "/dashboard";
      }
    },
  },
};

