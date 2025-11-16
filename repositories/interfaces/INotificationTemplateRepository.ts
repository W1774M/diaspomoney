/**
 * Interface pour le repository de templates de notifications
 */

import type { NotificationTemplate } from '@/types/notifications';
import type { IRepository } from './IRepository';

export interface INotificationTemplateRepository
  extends IRepository<NotificationTemplate, string> {
  /**
   * Trouver un template par nom et locale
   */
  findByNameAndLocale(
    name: string,
    locale: string
  ): Promise<NotificationTemplate | null>;

  /**
   * Trouver tous les templates pour une locale
   */
  findByLocale(locale: string): Promise<NotificationTemplate[]>;
}
