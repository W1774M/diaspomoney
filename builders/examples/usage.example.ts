/**
 * Exemples d'utilisation des QueryBuilders
 * 
 * Ce fichier montre comment utiliser les builders dans différents contextes
 */

import {
  BookingQueryBuilder,
  InvoiceQueryBuilder,
  QueryBuilder,
  TransactionQueryBuilder,
  UserQueryBuilder,
} from '@/builders';
import type { PaginationOptions } from '@/lib/types';
import {
  getBookingRepository,
  getInvoiceRepository,
  getTransactionRepository,
  getUserRepository,
} from '@/repositories';

// ============================================
// Exemple 1: QueryBuilder de base
// ============================================

export async function exampleBasicQueryBuilder() {
  const query = new QueryBuilder()
    .where('status', 'ACTIVE')
    .where('role', 'PROVIDER')
    .whereGreaterThan('rating', 4.0)
    .whereIn('country', ['France', 'Senegal', 'Mali'])
    .orderBy('rating', 'desc')
    .limit(10)
    .build();

  console.log('Query filters:', query.filters);
  console.log('Query sort:', query.sort);
  console.log('Query pagination:', query.pagination);
}

// ============================================
// Exemple 2: UserQueryBuilder
// ============================================

export async function exampleUserQueryBuilder() {
  const userRepository = getUserRepository();

  // Rechercher des providers actifs avec email vérifié en France
  const query = new UserQueryBuilder()
    .byRole('PROVIDER')
    .active()
    .emailVerified()
    .byCountry('France')
    .bySpecialty('HEALTH')
    .orderByRating('desc')
    .orderByReviewCount('desc')
    .limit(20)
    .build();

  // Normaliser pagination pour garantir limit et page
  const pagination: PaginationOptions = {
    limit: query.pagination.limit ?? 20,
    page: query.pagination.page ?? 1,
    ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
    ...(query.sort && { sort: query.sort }),
  };
  const result = await userRepository.findUsersWithFilters(
    query.filters,
    pagination,
  );

  console.log(`Found ${result.total} providers`);
  return result.data;
}

// ============================================
// Exemple 3: TransactionQueryBuilder
// ============================================

export async function exampleTransactionQueryBuilder(userId: string) {
  const transactionRepository = getTransactionRepository();

  // Transactions complétées d'un utilisateur en EUR entre 50€ et 500€
  const query = new TransactionQueryBuilder()
    .byUser(userId)
    .completed()
    .byCurrency('EUR')
    .amountBetween(50, 500)
    .createdBetween(
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    )
    .orderByAmount('desc')
    .page(1, 20)
    .build();

  // Normaliser pagination pour garantir limit et page
  const pagination: PaginationOptions = {
    limit: query.pagination.limit ?? 20,
    page: query.pagination.page ?? 1,
    ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
    ...(query.sort && { sort: query.sort }),
  };
  const result = await transactionRepository.findTransactionsWithFilters(
    query.filters,
    pagination,
  );

  console.log(`Found ${result.total} transactions`);
  return result.data;
}

// ============================================
// Exemple 4: BookingQueryBuilder
// ============================================

export async function exampleBookingQueryBuilder(providerId: string) {
  const bookingRepository = getBookingRepository();

  // Réservations à venir d'un provider
  const query = new BookingQueryBuilder()
    .byProvider(providerId)
    .upcoming()
    .byServiceType('HEALTH')
    .orderByAppointmentDate('asc')
    .limit(10)
    .build();

  // Normaliser pagination pour garantir limit et page
  const pagination: PaginationOptions = {
    limit: query.pagination.limit ?? 10,
    page: query.pagination.page ?? 1,
    ...(query.pagination.offset !== undefined ? { offset: query.pagination.offset } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
  const result = await bookingRepository.findBookingsWithFilters(
    query.filters,
    pagination,
  );

  console.log(`Found ${result.total} upcoming bookings`);
  return result.data;
}

// ============================================
// Exemple 5: InvoiceQueryBuilder
// ============================================

export async function exampleInvoiceQueryBuilder(userId: string) {
  const invoiceRepository = getInvoiceRepository();

  // Factures en retard d'un utilisateur
  const query = new InvoiceQueryBuilder()
    .byUser(userId)
    .overdue()
    .orderByDueDate('asc')
    .build();

  // Normaliser pagination pour garantir limit et page
  const pagination: PaginationOptions = {
    limit: query.pagination.limit ?? 50,
    page: query.pagination.page ?? 1,
    ...(query.pagination.offset !== undefined ? { offset: query.pagination.offset } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
  const result = await invoiceRepository.findInvoicesWithFilters(
    query.filters,
    pagination,
  );

  console.log(`Found ${result.total} overdue invoices`);
  return result.data;
}

// ============================================
// Exemple 6: Requête complexe avec $or
// ============================================

export async function exampleComplexQuery() {
  const userRepository = getUserRepository();

  // Utilisateurs actifs qui sont soit providers soit admins
  const query = new UserQueryBuilder()
    .whereOr([
      { roles: 'PROVIDER', status: 'ACTIVE' },
      { roles: 'ADMIN', status: 'ACTIVE' },
    ])
    .emailVerified()
    .orderBy('createdAt', 'desc')
    .limit(50)
    .build();

  // Normaliser pagination pour garantir limit et page
  const pagination: PaginationOptions = {
    limit: query.pagination.limit ?? 20,
    page: query.pagination.page ?? 1,
    ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
    ...(query.sort && { sort: query.sort }),
  };
  const result = await userRepository.findUsersWithFilters(
    query.filters,
    pagination,
  );

  return result.data;
}

// ============================================
// Exemple 7: Cloner et modifier un builder
// ============================================

export async function exampleCloneBuilder() {
  // Builder de base pour les providers
  const baseQuery = new UserQueryBuilder()
    .byRole('PROVIDER')
    .active()
    .emailVerified();

  // Créer de nouveaux builders avec les mêmes filtres de base
  // Note: clone() retourne QueryBuilder, donc on recrée des UserQueryBuilder
  const baseFilters = baseQuery.getFilters();
  const baseSort = baseQuery.getSort();
  const basePagination = baseQuery.getPagination();

  const healthProviders = new UserQueryBuilder()
    .where('roles', baseFilters['roles'])
    .where('status', baseFilters['status'])
    .where('emailVerified', baseFilters['emailVerified'])
    .bySpecialty('HEALTH')
    .orderByMultiple(baseSort as any)
    .page(basePagination.page || 1, basePagination.limit || 50)
    .build();

  const btpProviders = new UserQueryBuilder()
    .where('roles', baseFilters['roles'])
    .where('status', baseFilters['status'])
    .where('emailVerified', baseFilters['emailVerified'])
    .bySpecialty('BTP')
    .orderByMultiple(baseSort as any)
    .page(basePagination.page || 1, basePagination.limit || 50)
    .build();

  // Utiliser les deux queries
  const userRepository = getUserRepository();
  const healthPagination: PaginationOptions = {
    limit: healthProviders.pagination.limit ?? 50,
    page: healthProviders.pagination.page ?? 1,
    ...(healthProviders.pagination.offset !== undefined && { offset: healthProviders.pagination.offset }),
    ...(healthProviders.sort && { sort: healthProviders.sort }),
  };
  const btpPagination: PaginationOptions = {
    limit: btpProviders.pagination.limit ?? 50,
    page: btpProviders.pagination.page ?? 1,
    ...(btpProviders.pagination.offset !== undefined && { offset: btpProviders.pagination.offset }),
    ...(btpProviders.sort && { sort: btpProviders.sort }),
  };
  const [healthResult, btpResult] = await Promise.all([
    userRepository.findUsersWithFilters(healthProviders.filters, healthPagination),
    userRepository.findUsersWithFilters(btpProviders.filters, btpPagination),
  ]);

  return {
    health: healthResult.data,
    btp: btpResult.data,
  };
}

// ============================================
// Exemple 8: Utilisation dans une route API
// ============================================

export async function exampleAPIRoute(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const transactionRepository = getTransactionRepository();
  const query = new TransactionQueryBuilder();

  if (userId) {
    query.byUser(userId);
  }

  if (status) {
    query.byStatus(status as any);
  }

  if (minAmount) {
    query.minAmount(parseFloat(minAmount));
  }

  if (maxAmount) {
    query.maxAmount(parseFloat(maxAmount));
  }

  query.page(page, limit);

  const queryBuilt = query.build();
  const pagination: PaginationOptions = {
    limit: queryBuilt.pagination.limit ?? limit,
    page: queryBuilt.pagination.page ?? page,
    ...(queryBuilt.pagination.offset !== undefined ? { offset: queryBuilt.pagination.offset } : {}),
    ...(queryBuilt.sort ? { sort: queryBuilt.sort } : {}),
  };
  const result = await transactionRepository.findTransactionsWithFilters(
    queryBuilt.filters,
    pagination,
  );

  return {
    data: result.data,
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.total,
      hasMore: result.pagination.hasNext,
    },
  };
}

// ============================================
// Exemple 9: Builder avec reset
// ============================================

export async function exampleResetBuilder() {
  const query = new UserQueryBuilder()
    .byRole('PROVIDER')
    .active()
    .limit(10);

  // Utiliser la query
  const userRepository = getUserRepository();
  const query1 = query.build();
  const pagination1: PaginationOptions = {
    limit: query1.pagination.limit ?? 10,
    page: query1.pagination.page ?? 1,
    ...(query1.pagination.offset !== undefined && { offset: query1.pagination.offset }),
    ...(query1.sort && { sort: query1.sort }),
  };
  const result1 = await userRepository.findUsersWithFilters(
    query1.filters,
    pagination1,
  );

  // Réinitialiser et créer une nouvelle query
  query.reset()
    .byRole('CUSTOMER')
    .active()
    .limit(20);

  const query2 = query.build();
  const pagination2: PaginationOptions = {
    limit: query2.pagination.limit ?? 20,
    page: query2.pagination.page ?? 1,
    ...(query2.pagination.offset !== undefined && { offset: query2.pagination.offset }),
    ...(query2.sort && { sort: query2.sort }),
  };
  const result2 = await userRepository.findUsersWithFilters(
    query2.filters,
    pagination2,
  );

  return {
    providers: result1.data,
    customers: result2.data,
  };
}

