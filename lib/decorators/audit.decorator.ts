/**
 * Audit Decorator Pattern
 * 
 * Decorator pour l'audit automatique des actions
 * Enregistre les actions importantes dans les logs d'audit
 */

import { logger } from '@/lib/logger';
import { getAuditLogRepository } from '@/repositories';
import * as Sentry from '@sentry/nextjs';
import type { AuditDecoratorOptions } from '@/lib/types';
import { auth } from '@/auth';

/**
 * Masquer les champs sensibles dans les données d'audit
 */
function maskSensitiveData(data: any, fieldsToMask: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, fieldsToMask));
  }

  const masked = { ...data };
  for (const field of fieldsToMask) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  return masked;
}

/**
 * Decorator Audit pour l'audit automatique
 * 
 * @param options - Options d'audit
 * 
 * @example
 * class UserService {
 *   @Audit({ eventType: 'USER_DELETED', includeArgs: true })
 *   async deleteUser(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Audit(options: AuditDecoratorOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    const {
      eventType,
      includeArgs = true,
      includeResult = false,
      excludeSensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'],
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (!enabled) {
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;
      const startTime = Date.now();

      let result: any;
      let error: any = null;
      // success variable is used in the audit log creation below

      try {
        // Récupérer la session utilisateur pour l'audit
        let session: any = null;
        try {
          session = await auth();
        } catch {
          // Hors request-scope (tests, scripts), `auth()` peut throw → fail-open.
          session = null;
        }
        const userId = session?.user?.id || 'system';
        // userRoles is used in auditData below
        const userRoles = session?.user?.roles || [];

        // Préparer les données d'audit
        const auditData: any = {
          eventType,
          className,
          methodName,
          userId,
          userRoles,
          timestamp: new Date(),
          outcome: 'SUCCESS',
          riskScore: 0,
        };

        // Inclure les arguments si demandé
        if (includeArgs && args.length > 0) {
          const maskedArgs = args.map(arg =>
            maskSensitiveData(arg, excludeSensitiveFields),
          );
          auditData.args = maskedArgs;
        }

        // Exécuter la méthode originale
        result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        // Inclure le résultat si demandé
        if (includeResult && result !== undefined) {
          auditData.result = maskSensitiveData(result, excludeSensitiveFields);
        }

        auditData.executionTime = executionTime;

        // Enregistrer l'audit
        try {
          const auditLogRepository = getAuditLogRepository();
          await auditLogRepository.create({
            eventType,
            category: 'METHOD_EXECUTION',
            severity: 'INFO',
            userId,
            metadata: {
              className,
              methodName,
              ...(includeArgs && { args: auditData.args }),
              ...(includeResult && { result: auditData.result }),
              executionTime,
            },
            outcome: 'SUCCESS',
            riskScore: 0,
            timestamp: new Date(),
          } as any);
        } catch (auditError) {
          // Ne pas faire échouer la méthode si l'audit échoue
          logger.error(
            {
              type: 'audit_log_error',
              class: className,
              method: methodName,
              error: (auditError as Error).message,
            },
            `Failed to create audit log for ${className}.${methodName}`,
          );
        }

        if (log) {
          logger.info(
            {
              type: 'audit',
              class: className,
              method: methodName,
              eventType,
              userId,
              executionTime,
            },
            `Audit: ${eventType} - ${className}.${methodName}`,
          );
        }

        return result;
      } catch (err: any) {
        error = err;
        const executionTime = Date.now() - startTime;

        // Récupérer la session pour l'audit d'erreur
        let session: any = null;
        try {
          session = await auth();
        } catch {
          session = null;
        }
        const userId = session?.user?.id || 'system';

        // Enregistrer l'audit d'erreur
        try {
          const auditLogRepository = getAuditLogRepository();
          await auditLogRepository.create({
            eventType,
            category: 'METHOD_EXECUTION',
            severity: 'ERROR',
            userId,
            metadata: {
              className,
              methodName,
              ...(includeArgs && {
                args: args.map(arg =>
                  maskSensitiveData(arg, excludeSensitiveFields),
                ),
              }),
              error: error.message,
              executionTime,
            },
            outcome: 'FAILURE',
            riskScore: 50, // Score de risque plus élevé pour les erreurs
            timestamp: new Date(),
          } as any);
        } catch (auditError) {
          logger.error(
            {
              type: 'audit_log_error',
              class: className,
              method: methodName,
              error: (auditError as Error).message,
            },
            `Failed to create audit log for ${className}.${methodName}`,
          );
        }

        if (log) {
          logger.error(
            {
              type: 'audit_error',
              class: className,
              method: methodName,
              eventType,
              userId,
              error: error.message,
              executionTime,
            },
            `Audit error: ${eventType} - ${className}.${methodName}`,
          );
        }

        Sentry.captureException(error, {
          tags: {
            component: 'AuditDecorator',
            action: 'methodExecution',
            eventType,
          },
          extra: {
            className,
            methodName,
            userId,
            executionTime,
          },
        });

        throw error;
      }
    };

    return descriptor;
  };
}

