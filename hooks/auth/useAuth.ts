'use client';

import { useEffect, useRef, useState } from 'react';
import { useSignOut } from './useSignOut';

// Dedupe repeated unauthenticated fetches across components in the same session
// let __unauthenticatedMemo = false;

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
  const didFetchRef = useRef(false);
  const { signOut, isSigningOut } = useSignOut();

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Logique d'authentification simplifiée
  useEffect(() => {
    if (!isClient || didFetchRef.current) return;
    didFetchRef.current = true;

    console.log("[useAuth] Vérification de l'authentification...");

    // Vérifier si l'utilisateur est connecté via notre API
    fetch('/api/users/me', { cache: 'no-store' })
      .then(res => {
        console.log('[useAuth] /api/users/me response:', res.status);
        if (res.ok) {
          return res.json();
        }
        // Si 401, l'utilisateur n'est pas authentifié
        if (res.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('API error');
      })
      .then(data => {
        console.log('[useAuth] User data received:', data.user);
        const me = data.user;
        setUser({
          id: me.id,
          email: me.email,
          name: me.name,
          roles: me.roles || ['CUSTOMER'],
          status: me.status || 'ACTIVE',
          avatar: me.avatar || { image: '', name: me.name },
          oauth: me.oauth || {},
          phone: me.phone || '',
          company: me.company || '',
          address: me.address || '',
        });
        setIsAuthenticated((me.status || 'ACTIVE') === 'ACTIVE');
        console.log('[useAuth] Utilisateur authentifié:', me.name);
      })
      .catch(error => {
        console.log('[useAuth] Utilisateur non authentifié:', error.message);
        setUser(null);
        setIsAuthenticated(false);
        // __unauthenticatedMemo = true;//
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isClient]);

  // Utiliser le hook de déconnexion spécialisé
  const handleSignOut = async () => {
    // Nettoyer l'état local avant la déconnexion
    setUser(null);
    setIsAuthenticated(false);
    // __unauthenticatedMemo = true;

    // Utiliser le hook de déconnexion
    await signOut();
  };

  // Force refresh auth state (useful after login)
  const refreshAuth = async () => {
    // __unauthenticatedMemo = false;
    didFetchRef.current = false;
    setIsLoading(true);

    try {
      const res = await fetch('/api/users/me', { cache: 'no-store' });
      if (res.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        // __unauthenticatedMemo = true;
        return;
      }
      if (!res.ok) {
        setUser(null);
        setIsAuthenticated(false);
        // __unauthenticatedMemo = true;
        return;
      }
      const data = await res.json();
      const me = data.user as any;
      setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        roles: me.roles || ['CUSTOMER'],
        status: me.status || 'ACTIVE',
        avatar: me.avatar || { image: '', name: me.name },
        oauth: me.oauth || {},
        phone: me.phone || '',
        company: me.company || '',
        address: me.address || '',
      });
      setIsAuthenticated((me.status || 'ACTIVE') === 'ACTIVE');
    } catch (e) {
      console.error('useAuth refresh error:', e);
      setUser(null);
      setIsAuthenticated(false);
      // __unauthenticatedMemo = true;
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = () => user?.roles.includes('ADMIN') || false;
  const isProvider = () => user?.roles.includes('PROVIDER') || false;
  const isCSM = () => user?.roles.includes('CSM') || false;
  const isCustomer = () => user?.roles.includes('CUSTOMER') || false;

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
      ? 'loading'
      : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated',
  };
}
