import { useEffect, useState, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  createdAt: Date;
  [key: string]: any;
}

export interface UseUsersOptions {
  role?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  page?: number | undefined;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const fetchingRef = useRef(false);
  const previousOptionsRef = useRef<string>('');
  const hasFetchedRef = useRef(false);
  const lastFetchedKeyRef = useRef<string>('');
  const optionsRef = useRef({ role: options.role, status: options.status, search: options.search, limit: options.limit, offset: options.offset, page: options.page });

  // Extraire les valeurs pour éviter les dépendances sur l'objet options
  const role = options.role;
  const status = options.status;
  const search = options.search;
  const limit = options.limit;
  const offset = options.offset;
  const page = options.page;
  
  // Mettre à jour le ref seulement si les valeurs ont vraiment changé
  const optionsChanged = 
    optionsRef.current.role !== role ||
    optionsRef.current.status !== status ||
    optionsRef.current.search !== search ||
    optionsRef.current.limit !== limit ||
    optionsRef.current.offset !== offset ||
    optionsRef.current.page !== page;
  
  if (optionsChanged) {
    optionsRef.current = { role, status, search, limit, offset, page };
  }

  // Créer une clé de dépendance stable - seulement quand les valeurs changent vraiment
  const currentOptionsKey = JSON.stringify({
    role: role || null,
    status: status || null,
    search: search || null,
    limit: limit || null,
    offset: offset ?? null,
    page: page || null,
  });
  
  // Utiliser une ref pour stocker la dernière clé calculée
  const optionsKeyRef = useRef(currentOptionsKey);
  
  // Ne mettre à jour que si la clé a vraiment changé
  if (currentOptionsKey !== optionsKeyRef.current) {
    logger.debug({ 
      oldKey: optionsKeyRef.current,
      newKey: currentOptionsKey,
      role, 
      status, 
      search, 
      limit, 
      offset, 
      page 
    }, '[useUsers] optionsKey changé');
    optionsKeyRef.current = currentOptionsKey;
  }

  // Fonction pour récupérer les utilisateurs - mémorisée avec useCallback
  const fetchUsers = useCallback(async () => {
    // Utiliser la clé stockée dans la ref pour être cohérent
    const keyToUse = optionsKeyRef.current;
    logger.debug({
      fetching: fetchingRef.current,
      keyToUse,
      previousKey: previousOptionsRef.current,
    }, '[useUsers] fetchUsers appelé');
    
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) {
      logger.debug({}, '[useUsers] Déjà en cours de fetch, ignoré');
      return;
    }
    
    // La vérification des options est déjà faite dans useEffect
    logger.debug({}, '[useUsers] Nouveau fetch démarré');
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Utiliser les valeurs actuelles depuis optionsRef
      const currentRole = optionsRef.current.role;
      const currentStatus = optionsRef.current.status;
      const currentSearch = optionsRef.current.search;
      const currentLimit = optionsRef.current.limit;
      const currentOffset = optionsRef.current.offset;
      const currentPage = optionsRef.current.page;
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (currentRole) params.append('role', currentRole);
      if (currentStatus) params.append('status', currentStatus);
      if (currentSearch) params.append('search', currentSearch);
      if (currentLimit) params.append('limit', currentLimit.toString());
      // L'API attend 'page' plutôt que 'offset'
      if (currentPage) {
        params.append('page', currentPage.toString());
      } else if (currentOffset !== undefined && currentLimit) {
        // Convertir offset en page si nécessaire
        const pageNum = Math.floor(currentOffset / currentLimit) + 1;
        params.append('page', pageNum.toString());
      }

      // Appeler l'API route
      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      if (data.success) {
        const newUsers = data.data || [];
        logger.debug({
          count: newUsers.length,
          ids: newUsers.map((u: User) => u._id).slice(0, 5),
        }, '[useUsers] Données reçues');
        // Ne mettre à jour que si les données ont vraiment changé (comparaison stricte)
        setUsers(prevUsers => {
          logger.debug({
            prevCount: prevUsers.length,
            newCount: newUsers.length,
          }, '[useUsers] Comparaison des users');
          // Comparaison rapide : longueur
          if (prevUsers.length !== newUsers.length) {
            return newUsers;
          }
          
          // Comparaison des IDs
          const prevIds = new Set(prevUsers.map((u: User) => u._id));
          const newIds = new Set(newUsers.map((u: User) => u._id));
          if (prevIds.size !== newIds.size) {
            return newUsers;
          }
          
          // Vérifier si tous les IDs sont identiques
          const prevIdsArray = Array.from(prevIds) as string[];
          const newIdsArray = Array.from(newIds) as string[];
          const idsChanged = prevIdsArray.some((id: string) => !newIds.has(id)) || 
                            newIdsArray.some((id: string) => !prevIds.has(id));
          if (idsChanged) {
            return newUsers;
          }
          
          // Si les IDs sont identiques, vérifier si les données ont changé
          // en comparant un hash simple basé sur les emails (plus rapide qu'une comparaison complète)
          const prevEmails = prevUsers.map((u: User) => `${u._id}:${u.email || ''}`).sort().join('|');
          const newEmails = newUsers.map((u: User) => `${u._id}:${u.email || ''}`).sort().join('|');
          if (prevEmails !== newEmails) {
            return newUsers;
          }
          
          // Aucun changement détecté, retourner le tableau précédent pour éviter les re-renders
          logger.debug({}, '[useUsers] Aucun changement détecté, conservation du tableau précédent');
          return prevUsers;
        });
        setTotal(data.total || 0);
        // Marquer cette clé comme ayant été fetchée avec succès
        lastFetchedKeyRef.current = keyToUse;
        logger.info({ 
          count: newUsers.length, 
          total: data.total || 0,
          keyToUse 
        }, '[useUsers] Fetch terminé avec succès');
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      logger.error({ error }, '[useUsers] Erreur lors du fetch des utilisateurs');
      setError(error.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      logger.debug({}, '[useUsers] Fetch terminé, fetchingRef réinitialisé');
    }
  }, [currentOptionsKey]);

  useEffect(() => {
    const currentKey = currentOptionsKey;
    logger.debug({
      currentKey,
      lastFetchedKey: lastFetchedKeyRef.current,
      previousKey: previousOptionsRef.current,
      fetching: fetchingRef.current,
      hasFetched: hasFetchedRef.current,
      areEqual: currentKey === lastFetchedKeyRef.current,
    }, '[useUsers] useEffect déclenché');
    
    // Si les options n'ont pas changé depuis le dernier fetch réussi, ne rien faire
    if (currentKey === lastFetchedKeyRef.current && lastFetchedKeyRef.current !== '') {
      logger.debug({}, '[useUsers] Options identiques au dernier fetch, useEffect ignoré');
      return;
    }
    
    // Si déjà en cours de fetch, ne rien faire
    if (fetchingRef.current) {
      logger.debug({}, '[useUsers] Déjà en cours de fetch, useEffect ignoré');
      return;
    }
    
    // Si la clé est identique à la précédente (même si pas encore fetchée), ne rien faire
    if (currentKey === previousOptionsRef.current && previousOptionsRef.current !== '') {
      logger.debug({}, '[useUsers] Options identiques à la précédente, useEffect ignoré');
      return;
    }
    
    // Mettre à jour la référence AVANT d'appeler fetchUsers pour éviter les appels multiples
    previousOptionsRef.current = currentKey;
    hasFetchedRef.current = true;
    
    // Appeler fetchUsers directement sans délai pour éviter les problèmes de timing
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOptionsKey, fetchUsers]);

  // Fonction refetch stable qui force un nouveau fetch
  const refetch = useCallback(() => {
    previousOptionsRef.current = '';
    lastFetchedKeyRef.current = '';
    fetchingRef.current = false;
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    refetch,
  };
};
