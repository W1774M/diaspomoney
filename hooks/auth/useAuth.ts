'use client';
/**
 * useAuth Hook
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Cache Pattern (via auth-cache)
 * - Error Handling Pattern (structured logging côté client)
 */

import {
  clearAuthCache,
  getAuthPromise,
  getCachedAuth,
  setAuthPromise,
  setCachedAuth,
} from '@/lib/auth/auth-cache';
import { useEffect, useRef, useState } from 'react';
import { useSignOut } from './useSignOut';

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

  // Logique d'authentification avec cache partagé pour éviter les appels multiples
  useEffect(() => {
    if (!isClient || didFetchRef.current) return;
    didFetchRef.current = true;

    // Vérifier le cache partagé
    const cached = getCachedAuth();
    if (cached && cached.user) {
      const me = cached.user;
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
      setIsLoading(false);
      return;
    }

    // Vérifier si une requête est déjà en cours
    const existingPromise = getAuthPromise();
    if (existingPromise) {
      existingPromise
        .then(data => {
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
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // Créer une nouvelle requête
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(
      () => controller.abort(),
      5000
    );

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const fetchPromise = fetch('/api/users/me', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(res => {
        cleanup();
        if (res.ok) {
          return res.json();
        }
        if (res.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      })
      .then(data => {
        // Mettre en cache
        setCachedAuth(data.user);
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
        return data;
      })
      .catch(error => {
        cleanup();
        // Logging silencieux côté client - les erreurs sont gérées par le state
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Stocker la promesse pour que d'autres instances puissent la réutiliser
    setAuthPromise(fetchPromise);
  }, [isClient]);

  // Utiliser le hook de déconnexion spécialisé
  const handleSignOut = async () => {
    // Nettoyer l'état local avant la déconnexion
    setUser(null);
    setIsAuthenticated(false);
    // Nettoyer le cache partagé
    clearAuthCache();

    // Utiliser le hook de déconnexion
    await signOut();
  };

  // Force refresh auth state (useful after login)
  const refreshAuth = async () => {
    // Nettoyer le cache pour forcer un nouveau fetch
    clearAuthCache();
    didFetchRef.current = false;
    setIsLoading(true);

    try {
      const res = await fetch('/api/users/me', { cache: 'no-store' });
      if (res.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
        clearAuthCache();
        return;
      }
      if (!res.ok) {
        setUser(null);
        setIsAuthenticated(false);
        clearAuthCache();
        return;
      }
      const data = await res.json();
      // Mettre en cache
      setCachedAuth(data.user);
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
      // Logging silencieux côté client - les erreurs sont gérées par le state
      setUser(null);
      setIsAuthenticated(false);
      clearAuthCache();
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
