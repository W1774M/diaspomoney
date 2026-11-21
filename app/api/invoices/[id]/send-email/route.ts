import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import { PDFGeneratorService } from '@/services/invoice/pdf-generator.service';
import { getUserRepository } from '@/repositories';
import { sendEmail } from '@/lib/email/resend';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour envoyer une facture par email
 * Implémente les design patterns :
 * - Service Layer Pattern (via invoiceService)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/invoices/[id]/send-email',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoiceId = params.id;
    const userId = session.user.id;

    log.debug({ invoiceId, userId }, 'Sending invoice by email');

    // Utiliser le service pour récupérer la facture
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    // Vérifier les permissions
    const isOwner = invoice.userId === userId;
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      log.warn({
        userId,
        invoiceId,
        msg: 'Unauthorized access to invoice email',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 },
      );
    }

    // Récupérer l'utilisateur pour obtenir son email
    const userRepository = getUserRepository();
    const user = await userRepository.findById(invoice.userId);
    
    if (!user || !user.email) {
      log.warn({ invoiceId, userId: invoice.userId }, 'User not found or no email');
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou email manquant' },
        { status: 404 },
      );
    }

    // Générer le PDF de la facture
    log.debug({ invoiceId }, 'Generating invoice PDF');
    const pdfGeneratorService = PDFGeneratorService.getInstance();
    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(invoice);

    // Préparer le nom du fichier PDF
    const fileName = `facture-${invoice.invoiceNumber}.pdf`;

    // Préparer le contenu de l'email
    const userName = user.name || 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
      'Client';
    
    const invoiceAmount = invoice.amount.toFixed(2);
    const invoiceCurrency = invoice.currency || 'EUR';
    const invoiceDate = invoice.issueDate 
      ? new Date(invoice.issueDate).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('fr-FR');

    const emailSubject = `Facture ${invoice.invoiceNumber} - DiaspoMoney`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${emailSubject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f8fafc; border: 1px solid #e5e7eb; }
            .invoice-details { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .invoice-details h3 { margin-top: 0; color: #7c3aed; }
            .invoice-details p { margin: 8px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #7c3aed; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Votre facture</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              <p>Vous trouverez ci-joint votre facture <strong>${invoice.invoiceNumber}</strong>.</p>
              
              <div class="invoice-details">
                <h3>Détails de la facture</h3>
                <p><strong>Numéro de facture :</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Date d'émission :</strong> ${invoiceDate}</p>
                ${invoice.dueDate ? `<p><strong>Date d'échéance :</strong> ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
                <p><strong>Statut :</strong> ${invoice.status === 'paid' ? '✅ Payée' : invoice.status === 'pending' ? '⏳ En attente' : invoice.status}</p>
              </div>

              <div class="amount">
                Montant total : ${invoiceAmount} ${invoiceCurrency}
              </div>

              <p>Cette facture est disponible en pièce jointe au format PDF.</p>
              
              <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
              
              <p>Cordialement,<br>L'équipe DiaspoMoney</p>
            </div>
            <div class="footer">
              <p>DiaspoMoney - Connecter l'Europe à l'Afrique</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
Votre facture ${invoice.invoiceNumber} - DiaspoMoney

Bonjour ${userName},

Vous trouverez ci-joint votre facture ${invoice.invoiceNumber}.

Détails de la facture :
- Numéro de facture : ${invoice.invoiceNumber}
- Date d'émission : ${invoiceDate}
${invoice.dueDate ? `- Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}` : ''}
- Statut : ${invoice.status === 'paid' ? 'Payée' : invoice.status === 'pending' ? 'En attente' : invoice.status}
- Montant total : ${invoiceAmount} ${invoiceCurrency}

Cette facture est disponible en pièce jointe au format PDF.

Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
L'équipe DiaspoMoney

---
DiaspoMoney - Connecter l'Europe à l'Afrique
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    // Envoyer l'email avec le PDF en pièce jointe
    log.debug({ invoiceId, userEmail: user.email }, 'Sending invoice email');
    const emailSent = await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHTML,
      text: emailText,
      tags: [
        { name: 'type', value: 'invoice' },
        { name: 'invoice_number', value: invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_') },
        { name: 'user_email', value: user.email.replace(/[^a-zA-Z0-9_-]/g, '_') },
      ],
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!emailSent) {
      log.error({ invoiceId, userEmail: user.email }, 'Failed to send invoice email');
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 },
      );
    }

    log.info({ invoiceId, userId, userEmail: user.email }, 'Invoice sent by email successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Facture envoyée par email avec succès',
    });
  } catch (error) {
    log.error({ error, invoiceId: params.id }, 'Error sending invoice email');
    Sentry.captureException(error, {
      tags: {
        component: 'InvoiceEmailAPI',
        action: 'send-email',
      },
      extra: { invoiceId: params.id },
    });
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la facture par email" },
      { status: 500 },
    );
  }
}
