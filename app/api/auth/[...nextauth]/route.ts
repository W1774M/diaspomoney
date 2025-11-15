import { authConfig } from "@/auth.config";
import NextAuth from "next-auth";

const handler = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"] ?? "fallback-secret-for-development",
}) as any;

export const GET = handler;
export const POST = handler;
