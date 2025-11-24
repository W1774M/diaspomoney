/**
 * Transaction Decorator Pattern
 * 
 * Decorator pour gérer les transactions de base de données
 * Assure l'atomicité des opérations
 */

import { logger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { ClientSession } from 'mongodb';
import type { TransactionDecoratorOptions } from '@/lib/types';

/**
 * Decorator Transaction pour gérer les transactions MongoDB
 * 
 * @param options - Options de transaction
 * 
 * @example
 * class UserService {
 *   @Transaction({ rollbackOnError: true })
 *   async createUserWithProfile(userData: any, profileData: any) {
 *     // Logique avec transaction
 *   }
 * }
 */
export function Transaction(options: TransactionDecoratorOptions = {}) {
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
      isolationLevel = 'read-committed',
      timeout = 30000, // 30 secondes par défaut
      rollbackOnError = true,
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (!enabled) {
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;
      let session: ClientSession | null = null;

      try {
        // Obtenir le client MongoDB
        const client = await mongoClient;
        if (!client) {
          throw new Error('MongoDB client is not initialized');
        }

        // Démarrer une session
        session = client.startSession();

        // Options de transaction selon le niveau d'isolation
        const sessionOptions: any = {};
        if (isolationLevel === 'read-uncommitted') {
          sessionOptions.readConcern = { level: 'local' };
        } else if (isolationLevel === 'read-committed') {
          sessionOptions.readConcern = { level: 'majority' };
        } else if (isolationLevel === 'repeatable-read') {
          sessionOptions.readConcern = { level: 'snapshot' };
        } else if (isolationLevel === 'serializable') {
          sessionOptions.readConcern = { level: 'snapshot' };
          sessionOptions.writeConcern = { w: 'majority' };
        }

        // Démarrer la transaction
        session.startTransaction(sessionOptions);

        if (log) {
          logger.debug(
            {
              type: 'transaction_started',
              class: className,
              method: methodName,
              isolationLevel,
            },
            `Transaction started for ${className}.${methodName}`,
          );
        }

        // Créer un timeout pour la transaction
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Transaction timeout after ${timeout}ms`));
          }, timeout);
        });

        // Exécuter la méthode avec la session en paramètre
        // La méthode doit accepter la session comme dernier paramètre optionnel
        const methodPromise = originalMethod.apply(this, [...args, session]);

        // Attendre la méthode ou le timeout
        const result = await Promise.race([methodPromise, timeoutPromise]);

        // Commit la transaction
        await session.commitTransaction();

        if (log) {
          logger.info(
            {
              type: 'transaction_committed',
              class: className,
              method: methodName,
              isolationLevel,
            },
            `Transaction committed for ${className}.${methodName}`,
          );
        }

        return result;
      } catch (error: any) {
        // Rollback en cas d'erreur
        if (session && rollbackOnError) {
          try {
            await session.abortTransaction();

            if (log) {
              logger.warn(
                {
                  type: 'transaction_rolled_back',
                  class: className,
                  method: methodName,
                  error: error.message,
                },
                `Transaction rolled back for ${className}.${methodName}`,
              );
            }
          } catch (rollbackError) {
            logger.error(
              {
                type: 'transaction_rollback_error',
                class: className,
                method: methodName,
                error: (rollbackError as Error).message,
              },
              `Failed to rollback transaction for ${className}.${methodName}`,
            );
          }
        }

        if (log) {
          logger.error(
            {
              type: 'transaction_error',
              class: className,
              method: methodName,
              error: error.message,
              isolationLevel,
            },
            `Transaction error in ${className}.${methodName}`,
          );
        }

        Sentry.captureException(error, {
          tags: {
            component: 'TransactionDecorator',
            action: 'transactionError',
          },
          extra: {
            className,
            methodName,
            isolationLevel,
          },
        });

        throw error;
      } finally {
        // Fermer la session
        if (session) {
          await session.endSession();
        }
      }
    };

    return descriptor;
  };
}

