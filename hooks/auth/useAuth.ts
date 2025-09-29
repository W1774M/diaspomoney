"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  avatar: {
    image: string;
    name: string;
  };
  oauth?: {
    google?: { linked?: boolean; providerAccountId?: string };
    facebook?: { linked?: boolean; providerAccountId?: string };
  };
}

// legacy type removed

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        const data = await res.json();
        const me = data.user as any;
        setUser({
          id: me.id,
          email: me.email,
          name: me.name,
          roles: (me as any).roles || ["CUSTOMER"],
          status: (me as any).status || "ACTIVE",
          avatar: (me as any).avatar || { image: "", name: me.name },
          oauth: (me as any).oauth || {},
        });
        setIsAuthenticated(((me as any).status || "ACTIVE") === "ACTIVE");
      } catch (e) {
        console.error("useAuth /api/users/me error:", e);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  const signOut = () => {
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  const isAdmin = () => user?.roles.includes("ADMIN") || false;
  const isProvider = () => user?.roles.includes("PROVIDER") || false;
  const isCSM = () => user?.roles.includes("CSM") || false;
  const isCustomer = () => user?.roles.includes("CUSTOMER") || false;

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    isAdmin,
    isProvider,
    isCSM,
    isCustomer,
    status: isLoading
      ? "loading"
      : isAuthenticated
        ? "authenticated"
        : "unauthenticated",
  };
}
