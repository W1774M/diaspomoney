/**
 * Cache partagé pour éviter les appels multiples à /api/users/me
 * Utilisé par tous les hooks d'authentification
 */

interface CachedUser {
  user: any;
  timestamp: number;
  promise?: Promise<any>;
}

let authCache: CachedUser | null = null;
const CACHE_DURATION = 5000; // 5 secondes

export function getCachedAuth(): CachedUser | null {
  if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
    return authCache;
  }
  return null;
}

export function setCachedAuth(user: any): void {
  authCache = {
    user,
    timestamp: Date.now(),
  };
}

export function clearAuthCache(): void {
  authCache = null;
}

export function setAuthPromise(promise: Promise<any>): void {
  if (!authCache) {
    authCache = {
      user: null,
      timestamp: Date.now(),
      promise,
    };
  } else {
    authCache.promise = promise;
  }
}

export function getAuthPromise(): Promise<any> | null {
  return authCache?.promise || null;
}

