import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import * as Sentry from "@sentry/nextjs";
import { authConfig } from "./auth.config";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authConfig);
  // Erreurs Sentry rattachées à l'utilisateur (identifiant interne seul, jamais e-mail ni
  // nom : dataCollection.userInfo reste à false). Permet de compter les « utilisateurs touchés ».
  const userId = session?.user?.id;
  Sentry.setUser(userId ? { id: String(userId) } : null);
  return session;
}
