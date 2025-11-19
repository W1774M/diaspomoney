/**
 * PDF Generator Service - DiaspoMoney
 * Service de génération de PDF pour les factures
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via getUserRepository)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Singleton Pattern
 */

import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { getUserRepository } from '@/repositories';
import type { Invoice } from '@/repositories/interfaces/IInvoiceRepository';
import * as Sentry from '@sentry/nextjs';
import PDFDocument from 'pdfkit';

export class PDFGeneratorService {
  private static instance: PDFGeneratorService;
  private readonly userRepository = getUserRepository();
  private readonly log = childLogger({
    component: 'PDFGeneratorService',
  });

  static getInstance(): PDFGeneratorService {
    if (!PDFGeneratorService.instance) {
      PDFGeneratorService.instance = new PDFGeneratorService();
    }
    return PDFGeneratorService.instance;
  }

  /**
   * Générer un PDF de facture
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    try {
      this.log.debug({ invoiceId: invoice.id }, 'Generating invoice PDF');

      // Récupérer les informations du client
      const customer = await this.userRepository.findById(invoice.userId);
      const customerData = customer
        ? {
            name:
              customer.name ||
              `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
              'Client',
            email: customer.email,
            address: (customer as any).address,
            city: (customer as any).city,
            country: customer.country || (customer as any).countryOfResidence,
            postalCode: (customer as any).postalCode,
          }
        : undefined;

      // Récupérer les informations du prestataire si disponible
      let providerData;
      if (invoice.metadata?.['providerId']) {
        const provider = await this.userRepository.findById(
          invoice.metadata['providerId'],
        );
        if (provider) {
          providerData = {
            name:
              provider.name ||
              `${provider.firstName || ''} ${provider.lastName || ''}`.trim() ||
              'Prestataire',
            email: provider.email,
            address: (provider as any).address,
            city: (provider as any).city,
            country: provider.country || (provider as any).countryOfResidence,
            postalCode: (provider as any).postalCode,
          };
        }
      }

      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      // En-tête
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('FACTURE', { align: 'right' })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`N° ${invoice.invoiceNumber}`, { align: 'right' })
        .moveDown(2);

      // Informations de l'entreprise (DiaspoMoney)
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('DiaspoMoney', { align: 'left' })
        .font('Helvetica')
        .fontSize(10)
        .text('Plateforme de services pour la diaspora', { align: 'left' })
        .moveDown(1);

      // Informations du client
      if (customerData) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Facturé à:', { align: 'left' })
          .font('Helvetica')
          .fontSize(10)
          .text(customerData.name, { align: 'left' });

        if (customerData.email) {
          doc.text(customerData.email, { align: 'left' });
        }

        const customerAddress = [
          customerData.address,
          customerData.postalCode && customerData.city
            ? `${customerData.postalCode} ${customerData.city}`
            : customerData.city,
          customerData.country,
        ]
          .filter(Boolean)
          .join('\n');

        if (customerAddress) {
          doc.text(customerAddress, { align: 'left' });
        }

        doc.moveDown(1);
      }

      // Informations du prestataire (si disponible)
      if (providerData) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Prestataire:', { align: 'left' })
          .font('Helvetica')
          .fontSize(10)
          .text(providerData.name, { align: 'left' });

        if (providerData.email) {
          doc.text(providerData.email, { align: 'left' });
        }

        const providerAddress = [
          providerData.address,
          providerData.postalCode && providerData.city
            ? `${providerData.postalCode} ${providerData.city}`
            : providerData.city,
          providerData.country,
        ]
          .filter(Boolean)
          .join('\n');

        if (providerAddress) {
          doc.text(providerAddress, { align: 'left' });
        }

        doc.moveDown(1);
      }

      // Informations de la facture
      doc.moveDown(1);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Date d'émission: ${this.formatDate(invoice.createdAt)}`, {
          align: 'left',
        });

      if (invoice.dueDate) {
        doc.text(`Date d'échéance: ${this.formatDate(invoice.dueDate)}`, {
          align: 'left',
        });
      }

      doc.text(`Statut: ${this.getStatusText(invoice.status)}`, {
        align: 'left',
      });
      doc.moveDown(1);

      // Tableau des articles
      doc.moveDown(1);
      const tableTop = doc.y;
      const itemHeight = 30;
      const tableStartX = 50;
      const tableWidth = 500;

      // En-tête du tableau
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', tableStartX, tableTop, { width: 250 })
        .text('Qté', tableStartX + 250, tableTop, { width: 50, align: 'right' })
        .text('Prix unit.', tableStartX + 300, tableTop, {
          width: 80,
          align: 'right',
        })
        .text('Total', tableStartX + 380, tableTop, {
          width: 120,
          align: 'right',
        });

      // Ligne de séparation
      doc
        .moveTo(tableStartX, tableTop + 20)
        .lineTo(tableStartX + tableWidth, tableTop + 20)
        .stroke();

      // Articles
      let currentY = tableTop + 30;
      invoice.items.forEach(item => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(item.description, tableStartX, currentY, { width: 250 })
          .text(item.quantity.toString(), tableStartX + 250, currentY, {
            width: 50,
            align: 'right',
          })
          .text(
            this.formatCurrency(item.unitPrice, invoice.currency),
            tableStartX + 300,
            currentY,
            { width: 80, align: 'right' },
          )
          .text(
            this.formatCurrency(item.total, invoice.currency),
            tableStartX + 380,
            currentY,
            { width: 120, align: 'right' },
          );

        currentY += itemHeight;
      });

      // Totaux
      const totalsY = currentY + 10;
      doc
        .moveTo(tableStartX + 300, totalsY)
        .lineTo(tableStartX + tableWidth, totalsY)
        .stroke();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Sous-total:', tableStartX + 300, totalsY + 10, {
          width: 80,
          align: 'right',
        })
        .text(
          this.formatCurrency(
            invoice.amount - (invoice.tax || 0),
            invoice.currency,
          ),
          tableStartX + 380,
          totalsY + 10,
          { width: 120, align: 'right' },
        );

      if (invoice.tax && invoice.tax > 0) {
        doc
          .font('Helvetica')
          .text('TVA:', tableStartX + 300, totalsY + 30, {
            width: 80,
            align: 'right',
          })
          .text(
            this.formatCurrency(invoice.tax, invoice.currency),
            tableStartX + 380,
            totalsY + 30,
            { width: 120, align: 'right' },
          );
      }

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', tableStartX + 300, totalsY + 50, {
          width: 80,
          align: 'right',
        })
        .text(
          this.formatCurrency(
            invoice.totalAmount || invoice.amount,
            invoice.currency,
          ),
          tableStartX + 380,
          totalsY + 50,
          { width: 120, align: 'right' },
        );

      // Notes
      if (invoice.metadata?.['notes']) {
        doc.moveDown(2);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Notes:', { align: 'left' })
          .text(invoice.metadata['notes'], { align: 'left' });
      }

      // Pied de page
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 50;
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Merci pour votre confiance !', tableStartX, footerY, {
          align: 'center',
          width: tableWidth,
        })
        .text(
          'DiaspoMoney - Plateforme de services pour la diaspora',
          tableStartX,
          footerY + 15,
          { align: 'center', width: tableWidth },
        );

      // Finaliser le PDF et collecter le buffer
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          this.log.info(
            { invoiceId: invoice.id, pdfSize: buffer.length },
            'Invoice PDF generated successfully',
          );
          resolve(buffer);
        });

        doc.on('error', (error: Error) => {
          this.log.error(
            { error, invoiceId: invoice.id },
            'PDF generation error',
          );
          Sentry.captureException(error, {
            tags: {
              component: 'PDFGeneratorService',
              action: 'generateInvoicePDF',
            },
            extra: { invoiceId: invoice.id },
          });
          reject(error);
        });

        // Finaliser le PDF
        doc.end();
      });
    } catch (error) {
      this.log.error(
        { error, invoiceId: invoice.id },
        'Error generating invoice PDF',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'PDFGeneratorService',
          action: 'generateInvoicePDF',
        },
        extra: { invoiceId: invoice.id },
      });
      throw error;
    }
  }

  /**
   * Formater une date
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }

  /**
   * Formater une devise
   */
  private formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Obtenir le texte du statut
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      PAID: 'Payée',
      OVERDUE: 'En retard',
      CANCELLED: 'Annulée',
      SENT: 'Envoyée',
    };
    return statusMap[status] || status;
  }
}

// Instance singleton
export const pdfGeneratorService = PDFGeneratorService.getInstance();
