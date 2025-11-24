/**
 * Format de réponse API standardisé
 * Assure la cohérence des réponses API à travers toute l'application
 */

import { NextResponse } from 'next/server';

/**
 * Format standard pour une réponse API de succès
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore?: boolean;
  };
  metadata?: Record<string, any>;
}

/**
 * Format standard pour une réponse API d'erreur
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Type union pour toutes les réponses API
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Créer une réponse API de succès
 */
export function createSuccessResponse<T>(
  data?: T,
  options?: {
    message?: string;
    pagination?: ApiSuccessResponse['pagination'];
    metadata?: Record<string, any>;
  },
): ApiSuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(options?.message && { message: options.message }),
    ...(options?.pagination && { pagination: options.pagination }),
    ...(options?.metadata && { metadata: options.metadata }),
  };
}

/**
 * Créer une réponse API de succès avec pagination
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  options?: {
    message?: string;
    metadata?: Record<string, any>;
  },
): ApiSuccessResponse<T[]> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasMore = pagination.page < totalPages;

  return {
    success: true,
    data: items,
    pagination: {
      ...pagination,
      totalPages,
      hasMore,
    },
    ...(options?.message && { message: options.message }),
    ...(options?.metadata && { metadata: options.metadata }),
  };
}

/**
 * Créer une réponse API de succès pour une liste (sans pagination)
 */
export function createListResponse<T>(
  items: T[],
  options?: {
    message?: string;
    metadata?: Record<string, any>;
  },
): ApiSuccessResponse<T[]> {
  return {
    success: true,
    data: items,
    ...(options?.message && { message: options.message }),
    ...(options?.metadata && { metadata: options.metadata }),
  };
}

/**
 * Créer une réponse API de succès pour une ressource unique
 */
export function createResourceResponse<T>(
  resource: T,
  options?: {
    message?: string;
    metadata?: Record<string, any>;
  },
): ApiSuccessResponse<T> {
  return {
    success: true,
    data: resource,
    ...(options?.message && { message: options.message }),
    ...(options?.metadata && { metadata: options.metadata }),
  };
}

/**
 * Créer une réponse API d'erreur
 */
export function createErrorResponse(
  error: string,
  options?: {
    code?: string;
    details?: unknown;
    requestId?: string;
    statusCode?: number;
  },
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (options?.code) {
    response.code = options.code;
  }
  if (options?.details !== undefined) {
    response.details = options.details;
  }
  if (options?.requestId) {
    response.requestId = options.requestId;
  }

  return NextResponse.json(response, { status: options?.statusCode || 500 });
}

/**
 * Vérifier si une réponse est une réponse de succès
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Vérifier si une réponse est une réponse d'erreur
 */
export function isErrorResponse(
  response: ApiResponse,
): response is ApiErrorResponse {
  return response.success === false;
}

