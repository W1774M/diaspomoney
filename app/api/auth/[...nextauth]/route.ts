import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";

// NextAuth simple - Kubernetes gère le routage
const handler = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"] ?? '',
}) as any;

export const GET = handler;
export const POST = handler;
