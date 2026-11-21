import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      roles?: string[];
    } | null;
    provider?: string;
    providerAccountId?: string;
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    provider?: string;
    providerAccountId?: string;
    role?: string;
    roles?: string[];
  }
}

