
import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";

// NextAuth simple - Kubernetes gère le routage
// La configuration (trustHost, url) est définie dans auth.config.ts
const resolvedSecret =
  process.env["AUTH_SECRET"] ??
  process.env["NEXTAUTH_SECRET"] ??
  (process.env["NODE_ENV"] === "production"
    ? ""
    : "fallback-secret-for-development");

const handler = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  // Ne jamais passer un secret vide (peut causer erreurs JWT/CSRF difficiles à diagnostiquer).
  secret: resolvedSecret,
}) as any;

export const GET = handler;
export const POST = handler;
