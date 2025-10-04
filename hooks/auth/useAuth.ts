"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useSignOut } from "./useSignOut";

// Dedupe repeated unauthenticated fetches across components in the same session
let __unauthenticatedMemo = false;

interface User {
  phone: string;
  company: string;
  address: string;
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // const router = useRouter(); // Non utilisé car redirection gérée par useSignOut
  const didFetchRef = useRef(false);
  const { data: session, status } = useSession();
  const { signOut, isSigningOut } = useSignOut();

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for NextAuth session changes
  useEffect(() => {
    if (!isClient) return;

    // console.log("[useAuth] Session status:", status, "Session:", !!session);

    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      // console.log("[useAuth] Unauthenticated, setting state");
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      __unauthenticatedMemo = true;
      return;
    }

    if (status === "authenticated" && session) {
      // console.log("[useAuth] Authenticated, fetching user details");
      // Reset memo when we have a session
      __unauthenticatedMemo = false;
      didFetchRef.current = false;

      // Fetch user details from our API
      fetch("/api/users/me", { cache: "no-store" })
        .then(res => {
          // console.log("[useAuth] /api/users/me response:", res.status);
          if (res.ok) {
            return res.json();
          }
          throw new Error("Not authenticated");
        })
        .then(data => {
          // console.log("[useAuth] User data received:", data.user);
          const me = data.user;
          setUser({
            id: me.id,
            email: me.email,
            name: me.name,
            roles: me.roles || ["CUSTOMER"],
            status: me.status || "ACTIVE",
            avatar: me.avatar || { image: "", name: me.name },
            oauth: me.oauth || {},
            phone: me.phone || "",
            company: me.company || "",
            address: me.address || "",
          });
          setIsAuthenticated((me.status || "ACTIVE") === "ACTIVE");
          // );
        })
        .catch(_error => {
          // console.error("[useAuth] Error fetching user:", error);
          setUser(null);
          setIsAuthenticated(false);
          __unauthenticatedMemo = true;
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isClient, status, session]);

  // This useEffect is now handled by the NextAuth session listener above
  // Keeping it for fallback but it should not interfere
  useEffect(() => {
    if (!isClient || didFetchRef.current) return;
    didFetchRef.current = true;

    console.log(
      "[useAuth] Initial fetch - status:",
      status,
      "session:",
      !!session
    );

    // If we already have a session from NextAuth, don't fetch again
    if (status === "authenticated" && session) {
      console.log(
        "[useAuth] Already authenticated via NextAuth, skipping initial fetch"
      );
      return;
    }

    // Short-circuit if we've already confirmed unauthenticated
    if (__unauthenticatedMemo) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        console.log("[useAuth] Initial fetchMe call");
        const res = await fetch("/api/users/me", { cache: "no-store" });
        if (res.status === 401) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          __unauthenticatedMemo = true;
          return;
        }
        if (!res.ok) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          __unauthenticatedMemo = true;
          return;
        }
        const data = await res.json();
        const me = data.user as any;
        setUser({
          id: me.id,
          email: me.email,
          name: me.name,
          roles: me.roles || ["CUSTOMER"],
          status: me.status || "ACTIVE",
          avatar: me.avatar || { image: "", name: me.name },
          oauth: me.oauth || {},
          phone: me.phone || "",
          company: me.company || "",
          address: me.address || "",
        });
        setIsAuthenticated((me.status || "ACTIVE") === "ACTIVE");
      } catch (e) {
        console.error("useAuth /api/users/me error:", e);
        setUser(null);
        setIsAuthenticated(false);
        __unauthenticatedMemo = true;
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [isClient, status, session]);

  // Utiliser le hook de déconnexion spécialisé
  const handleSignOut = async () => {
    // Nettoyer l'état local avant la déconnexion
    setUser(null);
    setIsAuthenticated(false);
    __unauthenticatedMemo = true;

    // Utiliser le hook de déconnexion
    await signOut();
  };

  // Force refresh auth state (useful after login)
  const refreshAuth = async () => {
    __unauthenticatedMemo = false;
    didFetchRef.current = false;
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/me", { cache: "no-store" });
      if (res.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        __unauthenticatedMemo = true;
        return;
      }
      if (!res.ok) {
        setUser(null);
        setIsAuthenticated(false);
        __unauthenticatedMemo = true;
        return;
      }
      const data = await res.json();
      const me = data.user as any;
      setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        roles: me.roles || ["CUSTOMER"],
        status: me.status || "ACTIVE",
        avatar: me.avatar || { image: "", name: me.name },
        oauth: me.oauth || {},
        phone: me.phone || "",
        company: me.company || "",
        address: me.address || "",
      });
      setIsAuthenticated((me.status || "ACTIVE") === "ACTIVE");
    } catch (e) {
      console.error("useAuth refresh error:", e);
      setUser(null);
      setIsAuthenticated(false);
      __unauthenticatedMemo = true;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = () => user?.roles.includes("ADMIN") || false;
  const isProvider = () => user?.roles.includes("PROVIDER") || false;
  const isCSM = () => user?.roles.includes("CSM") || false;
  const isCustomer = () => user?.roles.includes("CUSTOMER") || false;

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut: handleSignOut,
    refreshAuth,
    isAdmin,
    isProvider,
    isCSM,
    isCustomer,
    isSigningOut,
    status: isLoading
      ? "loading"
      : isAuthenticated
      ? "authenticated"
      : "unauthenticated",
  };
}
