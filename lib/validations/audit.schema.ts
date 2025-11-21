/**
 * Schémas de validation Zod pour l'audit
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer un log d'audit
 */
export const CreateAuditLogSchema = z.object({
  userId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  action: z.string().min(1, 'Action is required').max(100),
  resource: z.string().min(1, 'Resource is required').max(100),
  resourceId: z.string().min(1).optional(),
  method: z.string().max(10).optional(),
  ipAddress: z.string().ip().optional().or(z.string().max(45).optional()),
  userAgent: z.string().max(500).optional(),
  location: z
    .object({
      country: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
        .optional(),
    })
    .optional(),
  details: z.record(z.unknown()).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Invalid severity level' }),
  }).default('LOW'),
  category: z.enum(
    [
      'AUTHENTICATION',
      'AUTHORIZATION',
      'DATA_ACCESS',
      'DATA_MODIFICATION',
      'DATA_DELETION',
      'CONFIGURATION',
      'SECURITY',
      'COMPLIANCE',
      'SYSTEM',
      'OTHER',
    ],
    {
      errorMap: () => ({ message: 'Invalid audit category' }),
    },
  ),
});

/**
 * Schéma pour les filtres de recherche d'audit
 */
export const AuditLogFiltersSchema = z.object({
  userId: z.string().min(1).optional(),
  action: z.string().max(100).optional(),
  resource: z.string().max(100).optional(),
  resourceId: z.string().min(1).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z
    .enum([
      'AUTHENTICATION',
      'AUTHORIZATION',
      'DATA_ACCESS',
      'DATA_MODIFICATION',
      'DATA_DELETION',
      'CONFIGURATION',
      'SECURITY',
      'COMPLIANCE',
      'SYSTEM',
      'OTHER',
    ])
    .optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  ipAddress: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
export type AuditLogFiltersInput = z.infer<typeof AuditLogFiltersSchema>;

