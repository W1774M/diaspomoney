/**
 * Quote Facade - DiaspoMoney
 *
 * Point d'entrée CRM unifié pour devis / demandes BTP + Education.
 * Applique les invariants domaine (`Quote.create`) puis délègue
 * à btpService / educationService pour la persistence métier.
 *
 * Délégation :
 * - btp.facade `createQuote` → quoteFacade.createQuote({ sector: 'BTP', ... })
 * - education.facade `createInquiry` → quoteFacade.createQuote({ sector: 'EDUCATION', ... })
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { Quote } from '@/domain/crm';
import { btpService } from '@/services/btp/btp.service';
import { educationService } from '@/services/education/education.service';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export type QuoteSector = 'BTP' | 'EDUCATION';

export interface QuoteFacadeCreateData {
  clientId?: string;
  sector: QuoteSector;
  /** Email de contact (sinon dérivé de `contact.email`) */
  contactEmail?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    relationship?: string;
  };
  [key: string]: unknown;
}

export interface QuoteFacadeResult {
  success: boolean;
  quote?: unknown;
  sector?: QuoteSector;
  error?: string;
}

const CreateQuoteFacadeSchema = z
  .object({
    sector: z.enum(['BTP', 'EDUCATION']),
    clientId: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contact: z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        relationship: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

/**
 * QuoteFacade - Facade CRM pour création de devis / inquiries
 */
export class QuoteFacade {
  private static instance: QuoteFacade;

  private constructor() {}

  static getInstance(): QuoteFacade {
    if (!QuoteFacade.instance) {
      QuoteFacade.instance = new QuoteFacade();
    }
    return QuoteFacade.instance;
  }

  /**
   * Créer un devis / demande (BTP ou Education)
   *
   * 1. Invariants domaine Quote (kind + contactEmail)
   * 2. Persistence via le service sectoriel
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateQuoteFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  @Audit({ eventType: 'QUOTE_CREATED_VIA_FACADE', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async createQuote(data: QuoteFacadeCreateData): Promise<QuoteFacadeResult> {
    try {
      const contactEmail =
        data.contactEmail || data.contact?.email || undefined;

      logger.info(
        {
          sector: data.sector,
          clientId: data.clientId,
          hasContactEmail: !!contactEmail,
        },
        'Creating quote via QuoteFacade',
      );

      // Invariants CRM (domaine Quote)
      if (contactEmail) {
        Quote.create({
          kind: data.sector,
          contactEmail,
          ...(data.clientId ? { clientId: data.clientId } : {}),
        });
      } else if (data.sector !== 'BTP' && data.sector !== 'EDUCATION') {
        throw new Error('Quote kind must be BTP or EDUCATION');
      }

      const { sector, clientId: _clientId, contactEmail: _email, ...sectorPayload } =
        data;

      let quote: unknown;

      if (sector === 'BTP') {
        quote = await btpService.createBTPQuote(sectorPayload as any);
      } else {
        quote = await educationService.createEducationInquiry(
          sectorPayload as any,
        );
      }

      logger.info(
        {
          sector,
          quoteId: (quote as any)?.id || (quote as any)?._id,
        },
        'Quote created successfully via QuoteFacade',
      );

      return {
        success: true,
        quote,
        sector,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          sector: data.sector,
          clientId: data.clientId,
        },
        'Error creating quote via QuoteFacade',
      );

      Sentry.captureException(error, {
        extra: {
          quoteData: {
            sector: data.sector,
            clientId: data.clientId,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création du devis',
      };
    }
  }
}

export const quoteFacade = QuoteFacade.getInstance();
