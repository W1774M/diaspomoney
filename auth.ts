import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authConfig } from "./auth.config";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authConfig);
  return session;
}
