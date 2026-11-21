// Auth hooks
export { useAuth } from './auth/useAuth';
export { useForgotPassword } from './auth/useForgotPassword';
export { useLogin } from './auth/useLogin';
export { useAuthorization, useHasRole, useHasPermission } from './auth/useAuthorization';
export type { AuthorizationOptions, AuthorizationResult } from './auth/useAuthorization';

// Data hooks
export { useProviderDetail } from './providers';
export type { ProviderRatingStats, UseProviderDetailReturn } from './providers';
export { useProviders } from './useProviders';
export { useUsers } from './useUsers';

// Services hooks
export * from './services';

// Dashboard hooks
export * from './dashboard';

// Users hooks
export * from './users';

// Invoices hooks
export * from './invoices';

// Quotes hooks
export * from './quotes';

// Settings hooks
export * from './settings';

// Beneficiaries hooks
export * from './beneficiaries';

// Bookings hooks (inclut useBookings)
export * from './bookings';

// Complaints hooks
export * from './complaints';

// Form hooks
export * from './forms';

// API hooks (useProvidersOptimized)
export * from './api';

// Messaging hooks
export * from './messaging';

// Notifications hooks
export * from './notifications';

// Payments hooks
export * from './payments';

// Transactions hooks
export * from './transactions';

// Specialities hooks
export * from './specialities';

// Statistics hooks
export * from './statistics';
