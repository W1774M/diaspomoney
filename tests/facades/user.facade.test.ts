/**
 * Tests unitaires pour UserFacade
 * 
 * Implémente les tests pour :
 * - createUserWithKYC
 * - getUsers
 * - Gestion d'erreurs
 * - Validation des données
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userFacade } from '@/facades/user.facade';
import type { UserFacadeData, UserStatus } from '@/lib/types';

// Mock des dépendances
vi.mock('@/services/user/user.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/repositories');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');

describe('UserFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createUserWithKYC', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      const userData: UserFacadeData = {
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        roles: ['CUSTOMER'],
      };

      // Mock du repository
      const mockUser = {
        _id: '123',
        id: '123',
        email: userData.email,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.create).mockResolvedValue(mockUser as any);

      const { userMapper } = await import('@/lib/mappers');
      vi.mocked(userMapper.map).mockReturnValue(mockUser as any);

      const result = await userFacade.execute(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(userData.email);
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const userData: UserFacadeData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.create).mockRejectedValue(
        new Error('Email déjà utilisé'),
      );

      const result = await userFacade.execute(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('devrait valider les données d\'entrée', async () => {
      const invalidData = {
        email: 'invalid-email', // Email invalide
        name: '', // Nom vide
      } as UserFacadeData;

      const result = await userFacade.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUsers', () => {
    it('devrait récupérer les utilisateurs avec filtres', async () => {
      const filters = {
        role: 'CUSTOMER' as const,
        status: ['ACTIVE'] as UserStatus[],
      };

      const pagination = {
        limit: 20,
        page: 1,
      };

      // Mock du repository
      const mockUsers = [
        {
          _id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          roles: ['CUSTOMER'],
          status: 'ACTIVE',
        },
        {
          _id: '2',
          email: 'user2@example.com',
          name: 'User 2',
          roles: ['CUSTOMER'],
          status: 'ACTIVE',
        },
      ];

      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.findUsersWithFilters).mockResolvedValue({
        data: mockUsers as any,
        total: 2,
        pagination: {
          page: 1,
          limit: 20,
          offset: 0,
          pages: 1,
          total: 2,
          hasNext: false,
          hasPrev: false,
        },
      });

      const { userMapper } = await import('@/lib/mappers');
      vi.mocked(userMapper.map).mockImplementation((user: any) => user as any);

      const result = await userFacade.getUsers(filters, pagination);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('devrait gérer la pagination correctement', async () => {
      const pagination = {
        limit: 10,
        page: 2,
      };

      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.findUsersWithFilters).mockResolvedValue({
        data: [] as any,
        total: 25,
        pagination: {
          page: 2,
          limit: 10,
          offset: 10,
          pages: 3,
          total: 25,
          hasNext: true,
          hasPrev: true,
        },
      });

      const result = await userFacade.getUsers({}, pagination);

      expect(result.success).toBe(true);
      expect(result.pagination?.page).toBe(2);
      expect(result.pagination?.limit).toBe(10);
      expect(result.total).toBe(25);
    });

    it('devrait gérer les erreurs lors de la récupération', async () => {
      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.findUsersWithFilters).mockRejectedValue(
        new Error('Erreur de connexion à la base de données'),
      );

      const result = await userFacade.getUsers({}, { limit: 20, page: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

