/**
 * Générateur de facture PDF avec jsPDF
 * Utilise HTML pour créer une facture professionnelle selon les standards fintech
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

export interface StripePaymentDetails {
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  paymentMethod?: {
    type?: string;
    card?: {
      brand?: string;
      last4?: string;
    };
  };
  charges?: {
    data?: Array<{
      receipt_url?: string;
      receipt_number?: string;
    }>;
  };
}

export interface InvoiceData {
  booking: BookingResponse;
  stripeDetails?: StripePaymentDetails | undefined;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email: string;
    phone?: string;
    siret?: string;
    vatNumber?: string;
  };
}

/**
 * Génère le template HTML de la facture
 */
function generateInvoiceHTML(data: InvoiceData): string {
  const { booking, stripeDetails, companyInfo } = data;

  // Formater les dates
  const issueDate = new Date(booking.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const paymentDate = stripeDetails?.created
    ? new Date(stripeDetails.created * 1000).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Numéro de facture
  const reservationNumber = booking.reservationNumber || booking.id.slice(-8).toUpperCase();
  const invoiceNumber = `FAC-${new Date(booking.createdAt).getFullYear()}-${reservationNumber}`;

  // Informations client
  const clientName =
    booking.metadata?.['clientFirstName'] && booking.metadata?.['clientLastName']
      ? `${booking.metadata['clientFirstName']} ${booking.metadata['clientLastName']}`
      : booking.metadata?.['clientName'] || 'Client';

  const clientEmail = booking.metadata?.['clientEmail'] || '';
  const clientPhone = booking.metadata?.['clientPhone'] || '';

  // Service
  const serviceName = booking.metadata?.['serviceLabel'] || booking.serviceId || 'Service';
  const serviceDescription = booking.metadata?.['serviceDescription'] || '';

  // Montants - Calculer à partir de basePrice + optionsPrice - discountAmount si totalAmount n'existe pas
  let unitPrice = 0;
  if (booking.metadata?.['totalAmount']) {
    unitPrice =
      typeof booking.metadata['totalAmount'] === 'number'
        ? booking.metadata['totalAmount']
        : typeof booking.metadata['totalAmount'] === 'string'
          ? parseFloat(booking.metadata['totalAmount'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
  } else {
    // Calculer le montant si totalAmount n'existe pas
    const basePrice =
      typeof booking.metadata?.['basePrice'] === 'number'
        ? booking.metadata['basePrice']
        : typeof booking.metadata?.['basePrice'] === 'string'
          ? parseFloat(booking.metadata['basePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : typeof booking.metadata?.['servicePrice'] === 'number'
            ? booking.metadata['servicePrice']
            : typeof booking.metadata?.['servicePrice'] === 'string'
              ? parseFloat(booking.metadata['servicePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
              : 0;

    const optionsPrice = (() => {
      if (booking.metadata?.['additionalOptions']) {
        try {
          const options =
            typeof booking.metadata['additionalOptions'] === 'string'
              ? JSON.parse(booking.metadata['additionalOptions'])
              : booking.metadata['additionalOptions'];
          if (Array.isArray(options)) {
            return options.reduce((sum: number, opt: any) => {
              const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
              return sum + optPrice;
            }, 0);
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
      return typeof booking.metadata?.['optionsPrice'] === 'number'
        ? booking.metadata['optionsPrice']
        : typeof booking.metadata?.['optionsPrice'] === 'string'
          ? parseFloat(booking.metadata['optionsPrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
    })();

    const discountAmount =
      typeof booking.metadata?.['discountAmount'] === 'number'
        ? booking.metadata['discountAmount']
        : typeof booking.metadata?.['discountAmount'] === 'string'
          ? parseFloat(booking.metadata['discountAmount'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;

    unitPrice = basePrice + optionsPrice - discountAmount;
  }

  const quantity = 1;
  const subtotal = unitPrice;
  const tax = 0; // TVA à 0% pour les services numériques
  const total = subtotal + tax;

  // Options supplémentaires
  let additionalOptionsHTML = '';
  if (booking.metadata?.['additionalOptions']) {
    try {
      const options =
        typeof booking.metadata['additionalOptions'] === 'string'
          ? JSON.parse(booking.metadata['additionalOptions'])
          : booking.metadata['additionalOptions'];

      if (Array.isArray(options) && options.length > 0) {
        additionalOptionsHTML = options
          .map(
            (opt: any) => {
              const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
              return `
            <tr class="option-row">
              <td class="option-desc">+ ${opt.label || opt.id || 'Option'}</td>
              <td class="text-center">1</td>
              <td class="text-right">${optPrice.toFixed(2).replace('.', ',')}€</td>
              <td class="text-right">${optPrice.toFixed(2).replace('.', ',')}€</td>
            </tr>
          `;
            },
          )
          .join('');
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  // Informations de paiement Stripe (seront intégrées dans le footer)
  let paymentInfoHTML = '';
  let hasStripePayment = false;
  if (stripeDetails) {
    hasStripePayment = true;
    const cardInfo =
      stripeDetails.paymentMethod?.card?.brand && stripeDetails.paymentMethod?.card?.last4
        ? `${stripeDetails.paymentMethod.card.brand.toUpperCase()} •••• ${stripeDetails.paymentMethod.card.last4}`
        : 'Carte bancaire';

    paymentInfoHTML = `
      <p><strong>Transaction ID:</strong> ${stripeDetails.paymentIntentId}</p>
      <p><strong>Moyen de paiement:</strong> ${cardInfo}</p>
      ${paymentDate ? `<p><strong>Date de paiement:</strong> ${paymentDate}</p>` : ''}
      <p><strong>Statut:</strong> <span class="status-${stripeDetails.status}">${stripeDetails.status === 'succeeded' ? 'Payé' : stripeDetails.status}</span></p>
    `;
  }

  // Calculer la date d'échéance (30 jours par défaut)
  const dueDate = new Date(booking.createdAt);
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateFormatted = dueDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #000000;
            background: #FAFAFA;
            padding: 15mm;
            width: 210mm;
            min-height: 297mm;
          }
          .invoice-container {
            background: white;
            padding: 20mm;
            min-height: 267mm;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #E5E7EB;
          }
          .company-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .company-logo {
            font-size: 28px;
            font-weight: 900;
            color: #000000;
            letter-spacing: -1px;
          }
          .company-dot {
            width: 8px;
            height: 8px;
            background: #FF6B35;
            border-radius: 50%;
            margin-top: 4px;
          }
          .company-name {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 2px;
            color: #000000;
            text-transform: uppercase;
          }
          .company-info {
            font-size: 8px;
            line-height: 1.8;
            color: #000000;
          }
          .invoice-title-section {
            text-align: right;
          }
          .invoice-title {
            font-size: 36px;
            font-weight: 900;
            color: #000000;
            margin-bottom: 15px;
            letter-spacing: 1px;
          }
          .invoice-details {
            font-size: 9px;
            line-height: 1.8;
            color: #000000;
          }
          .invoice-detail-row {
            margin-bottom: 3px;
          }
          .invoice-detail-label {
            font-weight: 600;
          }
          .parties-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            padding: 20px 0;
            border-top: 1px solid #E5E7EB;
            border-bottom: 1px solid #E5E7EB;
          }
          .party {
            flex: 1;
          }
          .party-title {
            font-size: 9px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .party-details {
            font-size: 8px;
            line-height: 2;
            color: #000000;
          }
          .party-name {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .items-section {
            margin: 30px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .items-table thead {
            border-bottom: 1px solid #000000;
          }
          .items-table th {
            padding: 10px 8px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-decoration: underline;
          }
          .items-table th.text-right {
            text-align: right;
          }
          .items-table th.text-center {
            text-align: center;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #E5E7EB;
          }
          .items-table td {
            padding: 12px 8px;
            font-size: 9px;
            color: #000000;
            vertical-align: top;
          }
          .items-table td.text-right {
            text-align: right;
          }
          .items-table td.text-center {
            text-align: center;
          }
          .item-desc {
            font-weight: 500;
          }
          .item-desc-small {
            font-size: 8px;
            color: #6B7280;
            margin-top: 4px;
            font-style: italic;
          }
          .option-row {
            background: #FAFAFA;
          }
          .option-desc {
            padding-left: 15px;
            color: #4B5563;
            font-size: 8px;
          }
          .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-container {
            width: 200px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 9px;
            padding: 4px 0;
          }
          .total-label {
            font-weight: 700;
            color: #000000;
          }
          .total-value {
            font-weight: 700;
            color: #000000;
          }
          .total-final {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #000000;
            font-size: 11px;
          }
          .total-final .total-label,
          .total-final .total-value {
            color: #FF6B35;
            font-weight: 900;
          }
          .footer-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
          }
          .payment-info,
          .terms-info {
            flex: 1;
          }
          .footer-title {
            font-size: 9px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer-content {
            font-size: 8px;
            line-height: 1.8;
            color: #000000;
          }
          .footer-content p {
            margin-bottom: 4px;
          }
          .bank-details {
            margin-top: 6px;
          }
          .bank-detail-row {
            margin-bottom: 3px;
          }
          .payment-section {
            margin: 20px 0;
            padding: 15px;
            background: #FFF5F0;
            border-left: 3px solid #FF6B35;
          }
          .payment-section-title {
            font-size: 9px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #000000;
            text-transform: uppercase;
          }
          .payment-details {
            font-size: 8px;
            line-height: 1.8;
            color: #000000;
          }
          .status-succeeded {
            color: #059669;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div>
              <div class="company-brand">
                <span class="company-logo">DM</span>
                <span class="company-dot"></span>
                <span class="company-name">DIASPOMONEY</span>
              </div>
              <div class="company-info">
                ${companyInfo.phone ? `Tél: ${companyInfo.phone}<br>` : ''}
                Email: ${companyInfo.email}<br>
                ${companyInfo.address}<br>
                ${companyInfo.postalCode} ${companyInfo.city}, ${companyInfo.country}<br>
                ${companyInfo.siret ? `SIRET: ${companyInfo.siret}<br>` : ''}
                ${companyInfo.vatNumber ? `TVA: ${companyInfo.vatNumber}` : ''}
              </div>
            </div>
            <div class="invoice-title-section">
              <div class="invoice-title">FACTURE</div>
              <div class="invoice-details">
                <div class="invoice-detail-row">
                  <span class="invoice-detail-label">FACTURE N°:</span> ${invoiceNumber}
                </div>
                <div class="invoice-detail-row">
                  <span class="invoice-detail-label">DATE:</span> ${issueDate.replace(/\s/g, ' ')}
                </div>
                <div class="invoice-detail-row">
                  <span class="invoice-detail-label">ÉCHÉANCE:</span> ${dueDateFormatted}
                </div>
              </div>
            </div>
          </div>

          <!-- Parties Section -->
          <div class="parties-section">
            <div class="party">
              <div class="party-title">ÉMETTEUR:</div>
              <div class="party-details">
                ${companyInfo.name}<br>
                ${companyInfo.phone ? `Tél: ${companyInfo.phone}<br>` : ''}
                Email: ${companyInfo.email}<br>
                ${companyInfo.address}<br>
                ${companyInfo.postalCode} ${companyInfo.city}, ${companyInfo.country}
              </div>
            </div>
            <div class="party">
              <div class="party-title">DESTINATAIRE:</div>
              <div class="party-details">
                <div class="party-name">${clientName}</div>
                ${clientEmail ? `${clientEmail}<br>` : ''}
                ${clientPhone ? `Tél: ${clientPhone}` : ''}
              </div>
            </div>
          </div>

          ${paymentInfoHTML ? `
          <div class="payment-section">
            <div class="payment-section-title">Informations de paiement</div>
            <div class="payment-details">
              ${paymentInfoHTML}
            </div>
          </div>
          ` : ''}

          <!-- Items Section -->
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description:</th>
                  <th class="text-center">Quantité:</th>
                  <th class="text-right">Prix unitaire HT:</th>
                  <th class="text-right">Total HT:</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="item-desc">
                    ${serviceName}
                    ${serviceDescription ? `<div class="item-desc-small">${serviceDescription}</div>` : ''}
                  </td>
                  <td class="text-center">${quantity}</td>
                  <td class="text-right">${unitPrice.toFixed(2).replace('.', ',')}€</td>
                  <td class="text-right">${subtotal.toFixed(2).replace('.', ',')}€</td>
                </tr>
                ${additionalOptionsHTML}
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          <div class="totals-section">
            <div class="totals-container">
              <div class="total-row">
                <span class="total-label">TOTAL HT:</span>
                <span class="total-value">${subtotal.toFixed(2).replace('.', ',')}€</span>
              </div>
              <div class="total-row">
                <span class="total-label">TVA:</span>
                <span class="total-value">${tax.toFixed(2).replace('.', ',')}€</span>
              </div>
              <div class="total-row">
                <span class="total-label">REMISE:</span>
                <span class="total-value">-</span>
              </div>
              <div class="total-row total-final">
                <span class="total-label">TOTAL TTC:</span>
                <span class="total-value">${total.toFixed(2).replace('.', ',')}€</span>
              </div>
            </div>
          </div>

          <!-- Footer Section -->
          <div class="footer-section">
            <div class="payment-info">
              <div class="footer-title">Règlement:</div>
              <div class="footer-content">
                <p>Par virement bancaire:</p>
                <div class="bank-details">
                  <div class="bank-detail-row">Banque: DiaspoMoney Bank</div>
                  <div class="bank-detail-row">IBAN: FR76 XXXX XXXX XXXX XXXX XXXX XX</div>
                  <div class="bank-detail-row">BIC: DIASFRPPXXX</div>
                </div>
                ${hasStripePayment ? `
                <p style="margin-top: 10px;">Ou par carte bancaire via Stripe:</p>
                <div class="bank-details">
                  <div class="bank-detail-row">Transaction: ${stripeDetails?.paymentIntentId}</div>
                  ${stripeDetails?.paymentMethod?.card ? `
                  <div class="bank-detail-row">Carte: ${stripeDetails.paymentMethod.card.brand?.toUpperCase()} •••• ${stripeDetails.paymentMethod.card.last4}</div>
                  ` : ''}
                </div>
                ` : ''}
              </div>
            </div>
            <div class="terms-info">
              <div class="footer-title">Termes & Conditions</div>
              <div class="footer-content">
                <p>En cas de retard de paiement, des pénalités de retard au taux de trois fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros.</p>
                <p style="margin-top: 8px;">Pour les conditions générales, consultez notre site web: <strong>www.diaspomoney.fr</strong></p>
                ${booking.metadata?.['notes'] || booking.metadata?.['additionalNotes'] ? `
                <p style="margin-top: 10px; font-style: italic; color: #6B7280;">
                  ${(booking.metadata?.['notes'] || booking.metadata?.['additionalNotes']) as string}
                </p>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Génère une facture PDF professionnelle à partir des données de booking et Stripe
 * Utilise un template HTML converti en PDF avec jsPDF
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  // Créer le template HTML
  const htmlContent = generateInvoiceHTML(data);

  // Créer un élément temporaire pour le HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  document.body.appendChild(tempDiv);

  try {
    // Convertir HTML en canvas avec html2canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794, // 210mm en pixels à 96 DPI
      height: tempDiv.scrollHeight,
    });

    // Créer le PDF avec jsPDF
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Si le contenu dépasse une page, diviser en plusieurs pages
    const pageHeight = 297; // A4 height in mm
    let heightLeft = pdfHeight;
    let position = 0;

    // Ajouter la première page
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      doc.addPage();
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    return doc;
  } finally {
    // Nettoyer l'élément temporaire
    document.body.removeChild(tempDiv);
  }
}

/**
 * Récupère les détails d'un PaymentIntent depuis Stripe
 */
export async function getStripePaymentDetails(
  paymentIntentId: string,
): Promise<StripePaymentDetails | null> {
  try {
    const response = await fetch(`/api/stripe/payment-intent/${encodeURIComponent(paymentIntentId)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Stripe payment details:', error);
    return null;
  }
}

