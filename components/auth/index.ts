/**
 * Auth Components Exports
 */

export { default as ProtectedRoute } from '../ProtectedRoute';
export { default as AuthorizedRoute, AdminRoute, RoleRoute } from './AuthorizedRoute';
export { default as AuthorizedContent } from './AuthorizedContent';
export type { AuthorizedRouteProps } from './AuthorizedRoute';
export type { AuthorizedContentProps } from './AuthorizedContent';

