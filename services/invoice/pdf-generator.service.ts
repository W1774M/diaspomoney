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
import { Performance } from '@/lib/decorators/performance.decorator';
import { childLogger } from '@/lib/logger';
import { CURRENCIES } from '@/lib/constants';
import { getUserRepository } from '@/repositories';
import type { Invoice } from '@/repositories/interfaces/IInvoiceRepository';
import type { User } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import PDFDocument from 'pdfkit';
import { DIASPOMONEY_BRANDING, generatePDFKitHeader } from '@/lib/pdf/branding';

/**
 * Type pour les informations d'adresse d'un utilisateur
 */
interface UserAddress {
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  countryOfResidence?: string;
}

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
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    try {
      this.log.debug({ invoiceId: invoice.id }, 'Generating invoice PDF');

      // Récupérer les informations du client
      const customer = await this.userRepository.findById(invoice.userId);
      const customerRecord = customer as User & UserAddress;
      const customerData = customer
        ? {
            name:
              customer.name ||
              `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
              'Client',
            email: customer.email,
            address: customerRecord.address,
            city: customerRecord.city,
            country: customerRecord['country'] || customerRecord.countryOfResidence,
            postalCode: customerRecord.postalCode,
          }
        : undefined;

      // Récupérer les informations du prestataire si disponible
      let providerData: typeof customerData;
      if (invoice.metadata?.['providerId']) {
        const provider = await this.userRepository.findById(
          invoice.metadata['providerId'],
        );
        if (provider) {
          const providerRecord = provider as User & UserAddress;
          providerData = {
            name:
              provider.name ||
              `${provider.firstName || ''} ${provider.lastName || ''}`.trim() ||
              'Prestataire',
            email: provider.email,
            address: providerRecord.address,
            city: providerRecord.city,
            country: providerRecord['country'] || providerRecord.countryOfResidence,
            postalCode: providerRecord.postalCode,
          };
        }
      }

      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        // Pages gardées en mémoire : le pied de page est ajouté sur chacune à la fin
        bufferPages: true,
        margins: {
          top: 50,
          bottom: 80, // Plus d'espace pour le footer avec branding
          left: 50,
          right: 50,
        },
      });

      // Header avec branding DiaspoMoney
      const headerEndY = generatePDFKitHeader(doc, { includeLogo: false });
      doc.y = headerEndY;
      doc.moveDown(1);

      // En-tête de facture
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(DIASPOMONEY_BRANDING.colors.text)
        .text('FACTURE', { align: 'right' })
        .moveDown(0.5);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`N° ${invoice.invoiceNumber}`, { align: 'right' })
        .moveDown(1);

      // Informations de l'entreprise (DiaspoMoney)
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(DIASPOMONEY_BRANDING.colors.primary)
        .text(DIASPOMONEY_BRANDING.company.name, { align: 'left' })
        .font('Helvetica')
        .fontSize(10)
        .fillColor(DIASPOMONEY_BRANDING.colors.textLight)
        .text(DIASPOMONEY_BRANDING.company.tagline, { align: 'left' })
        .fillColor(DIASPOMONEY_BRANDING.colors.text)
        .fontSize(9)
        .text(`${DIASPOMONEY_BRANDING.company.email}`, { align: 'left' })
        .text(`${DIASPOMONEY_BRANDING.company.address}`, { align: 'left' })
        .text(`${DIASPOMONEY_BRANDING.company.postalCode} ${DIASPOMONEY_BRANDING.company.city}, ${DIASPOMONEY_BRANDING.company.country}`, { align: 'left' })
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

      // En-tête du tableau (répété en haut de chaque nouvelle page)
      const drawTableHeader = (y: number) => {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Description', tableStartX, y, { width: 250 })
          .text('Qté', tableStartX + 250, y, { width: 50, align: 'right' })
          .text('Prix unit.', tableStartX + 300, y, {
            width: 80,
            align: 'right',
          })
          .text('Total', tableStartX + 380, y, {
            width: 120,
            align: 'right',
          });
        doc
          .moveTo(tableStartX, y + 20)
          .lineTo(tableStartX + tableWidth, y + 20)
          .stroke();
        return y + 30;
      };
      // Bas utilisable de la page : au-delà, PDFKit ouvrirait une page par cellule écrite
      const pageBottom = () => doc.page.height - doc.page.margins.bottom;

      // Articles
      let currentY = drawTableHeader(tableTop);
      invoice.items.forEach(item => {
        if (currentY + itemHeight > pageBottom()) {
          doc.addPage();
          currentY = drawTableHeader(doc.page.margins.top);
        }
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

      // Totaux (sur une nouvelle page s'ils ne tiennent plus)
      if (currentY + 80 > pageBottom()) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
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

      // Notes et remerciement sur toute la largeur (le curseur était resté dans la
      // dernière colonne des totaux)
      if (invoice.metadata?.['notes']) {
        doc.moveDown(2);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Notes:', tableStartX, doc.y, { align: 'left', width: tableWidth })
          .text(invoice.metadata['notes'], { align: 'left', width: tableWidth });
      }

      // Ajouter un message de remerciement avec branding
      doc.moveDown(2);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(DIASPOMONEY_BRANDING.colors.primary)
        .text('Merci pour votre confiance !', tableStartX, doc.y, { align: 'center', width: tableWidth })
        .fillColor(DIASPOMONEY_BRANDING.colors.text);

      // Pied de page sur chaque page, une fois tout le contenu écrit. (Un écouteur
      // « pageAdded » posé ici n'était jamais appelé : le contenu était déjà écrit.)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const page = doc.page;
        const footerY = page.height - 50;
        // Le pied de page est sous la marge basse : la lever le temps de l'écrire,
        // sinon PDFKit ouvrirait une nouvelle page.
        const bottomMargin = page.margins.bottom;
        page.margins.bottom = 0;

        doc.save();
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(DIASPOMONEY_BRANDING.colors.textLight)
          .text(
            `${DIASPOMONEY_BRANDING.company.name} - ${DIASPOMONEY_BRANDING.company.tagline}`,
            page.margins.left,
            footerY,
            {
              align: 'center',
              width: page.width - page.margins.left - page.margins.right,
            },
          )
          .text(
            `${DIASPOMONEY_BRANDING.company.email} | ${DIASPOMONEY_BRANDING.company.website}`,
            page.margins.left,
            footerY + 12,
            {
              align: 'center',
              width: page.width - page.margins.left - page.margins.right,
            },
          );
        
        doc.restore();
        page.margins.bottom = bottomMargin;
      }

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
  private formatCurrency(amount: number, currency: string = CURRENCIES.EUR.code): string {
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
