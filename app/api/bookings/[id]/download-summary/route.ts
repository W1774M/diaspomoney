/**
 * API Route pour télécharger le résumé d'une commande en PDF
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { ROLES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const DownloadSummarySchema = z.object({
  elements: z.array(z.string()).min(1, 'Au moins un élément doit être sélectionné'),
});

/**
 * POST /api/bookings/[id]/download-summary - Générer et télécharger le résumé PDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/download-summary',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    const isProvider = userRoles.includes(ROLES.PROVIDER);

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json({ error: 'ID de réservation invalide' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = DownloadSummarySchema.safeParse(body);
    if (!parsed.success) {
      log.warn({ errors: parsed.error.errors }, 'Invalid request body');
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 },
      );
    }

    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions : admin ou provider assigné à la réservation
    if (!isAdmin) {
      if (!isProvider || booking.providerId !== session.user.id) {
        log.warn({ userId: session.user.id, roles: userRoles, bookingId }, 'Access denied: not authorized');
        return NextResponse.json(
          { error: 'Accès refusé. Vous devez être administrateur ou prestataire assigné à cette réservation.' },
          { status: 403 },
        );
      }
    }

    // Générer le PDF avec les éléments sélectionnés
    const { jsPDF } = await import('jspdf');
    const { applyJSPDFBranding, generateJSPDFFooter } = await import('@/lib/pdf/branding');
    const doc = new jsPDF();
    
    // Appliquer le branding DiaspoMoney
    let yPos = applyJSPDFBranding(doc);
    
    // Fonction helper pour vérifier et gérer les sauts de page
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPos + requiredSpace > 270) {
        doc.addPage();
        yPos = applyJSPDFBranding(doc);
        generateJSPDFFooter(doc, doc.getCurrentPageInfo().pageNumber);
      }
    };
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234); // Couleur primaire DiaspoMoney
    doc.text('Résumé de la commande', 20, yPos);
    yPos += 10;
    
    // Ajouter le numéro de réservation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const reservationNumber = booking.reservationNumber || booking.id;
    doc.text(`Numéro de réservation: ${reservationNumber}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    
    if (parsed.data.elements.includes('clientInfo')) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.text('Informations client', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const clientName = (booking.metadata?.['clientFirstName'] && booking.metadata?.['clientLastName'])
        ? `${booking.metadata['clientFirstName']} ${booking.metadata['clientLastName']}`
        : booking.metadata?.['clientName'] || 'N/A';
      doc.text(`Nom: ${clientName}`, 25, yPos);
      yPos += 7;
      const clientEmail = booking.metadata?.['clientEmail'] || 'N/A';
      doc.text(`Email: ${clientEmail}`, 25, yPos);
      yPos += 10;
    }
    
    if (parsed.data.elements.includes('serviceDetails')) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.text('Détails du service', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const serviceName = booking.metadata?.['serviceLabel'] || booking.serviceId || 'N/A';
      doc.text(`Service: ${serviceName}`, 25, yPos);
      yPos += 7;
      const serviceType = booking.serviceType || 'N/A';
      doc.text(`Type: ${serviceType}`, 25, yPos);
      yPos += 7;
      if (booking.metadata?.['serviceCategory']) {
        doc.text(`Catégorie: ${booking.metadata['serviceCategory']}`, 25, yPos);
        yPos += 7;
      }
      if (booking.metadata?.['serviceDescription']) {
        const description = booking.metadata['serviceDescription'] as string;
        // Découper la description si elle est trop longue
        const maxWidth = 170;
        const lines = doc.splitTextToSize(description, maxWidth);
        lines.forEach((line: string) => {
          doc.text(`Description: ${line}`, 25, yPos);
          yPos += 7;
        });
      }
      if (booking.metadata?.['servicePrice']) {
        const price = booking.metadata['servicePrice'];
        const formattedPrice = typeof price === 'number' ? price.toFixed(2) : price;
        doc.text(`Prix: ${formattedPrice}€`, 25, yPos);
        yPos += 7;
      }
      yPos += 5;
    }
    
    if (parsed.data.elements.includes('beneficiaryInfo')) {
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.text('Informations bénéficiaire', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      if (booking.recipient) {
        const recipient = booking.recipient as any;
        const beneficiaryName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'N/A';
        doc.text(`Nom: ${beneficiaryName}`, 25, yPos);
        yPos += 7;
        if (recipient.phone) {
          doc.text(`Téléphone: ${recipient.phone}`, 25, yPos);
          yPos += 7;
        }
        if (recipient.email) {
          doc.text(`Email: ${recipient.email}`, 25, yPos);
          yPos += 7;
        }
      } else {
        const beneficiaryName = booking.metadata?.['beneficiaryName'] || 
          (booking.metadata?.['beneficiaryFirstName'] && booking.metadata?.['beneficiaryLastName']
            ? `${booking.metadata['beneficiaryFirstName']} ${booking.metadata['beneficiaryLastName']}`
            : 'N/A');
        doc.text(`Nom: ${beneficiaryName}`, 25, yPos);
        yPos += 7;
        if (booking.metadata?.['beneficiaryPhone']) {
          doc.text(`Téléphone: ${booking.metadata['beneficiaryPhone']}`, 25, yPos);
          yPos += 7;
        }
        if (booking.metadata?.['beneficiaryEmail']) {
          doc.text(`Email: ${booking.metadata['beneficiaryEmail']}`, 25, yPos);
          yPos += 7;
        }
      }
      yPos += 5;
    }
    
    if (parsed.data.elements.includes('appointmentInfo')) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.text('Informations de rendez-vous', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      if (booking.appointmentDate) {
        const appointmentDate = new Date(booking.appointmentDate);
        doc.text(`Date: ${appointmentDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, 25, yPos);
        yPos += 7;
      }
      if (booking.timeslot) {
        doc.text(`Heure: ${booking.timeslot}`, 25, yPos);
        yPos += 7;
      }
      if (!booking.appointmentDate && !booking.timeslot) {
        doc.text('Aucun rendez-vous programmé', 25, yPos);
        yPos += 7;
      }
      yPos += 5;
    }
    
    if (parsed.data.elements.includes('additionalOptions')) {
      const additionalOptions = booking.metadata?.['additionalOptions'];
      if (additionalOptions) {
        let options: any[] = [];
        try {
          const rawOptions = typeof additionalOptions === 'string' ? JSON.parse(additionalOptions) : additionalOptions;
          if (Array.isArray(rawOptions) && rawOptions.length > 0) {
            options = rawOptions;
          }
        } catch {
          // Ignore parsing errors
        }
        
        if (options.length > 0) {
          checkPageBreak(15 + options.length * 7);
          doc.setFontSize(14);
          doc.text('Options supplémentaires', 20, yPos);
          yPos += 10;
          doc.setFontSize(10);
          options.forEach((opt: any) => {
            const label = opt.label || opt.id || 'Option';
            const price = typeof opt.price === 'number' ? opt.price.toFixed(2) : opt.price || '0';
            doc.text(`${label}: +${price}€`, 25, yPos);
            yPos += 7;
          });
          yPos += 5;
        }
      }
    }
    
    if (parsed.data.elements.includes('progressHistory')) {
      const progressHistory = booking.metadata?.['progressHistory'];
      if (Array.isArray(progressHistory) && progressHistory.length > 0) {
        checkPageBreak(20 + progressHistory.length * 15);
        doc.setFontSize(14);
        doc.text('Historique de progression', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        
        const stepLabels: Record<number, string> = {
          1: 'Étape 1 : Informations client',
          2: 'Étape 2 : Sélection du service',
          3: 'Étape 3 : Paiement',
          4: 'Étape 4 : Confirmation',
        };
        
        progressHistory.forEach((entry: any) => {
          if (entry && typeof entry.step === 'number') {
            const stepLabel = stepLabels[entry.step] || `Étape ${entry.step}`;
            const status = entry.completed ? '✓ Complétée' : 'En cours';
            doc.text(`${stepLabel}: ${status}`, 25, yPos);
            yPos += 7;
            if (entry.timestamp) {
              const timestamp = new Date(entry.timestamp).toLocaleString('fr-FR');
              doc.text(`  Le ${timestamp}`, 30, yPos);
              yPos += 7;
            }
            if (entry.validatedByAdmin) {
              doc.text('  Validée par l\'administrateur', 30, yPos);
              yPos += 7;
            }
            yPos += 3;
          }
        });
        yPos += 5;
      }
    }
    
    if (parsed.data.elements.includes('providerInfo')) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.text('Informations prestataire', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      
      const assignedProviderType = booking.metadata?.['assignedProviderType'] as string | undefined;
      const assignedProviderName = booking.metadata?.['assignedProviderName'] as string | undefined;
      const assignedProviderEmail = booking.metadata?.['assignedProviderEmail'] as string | undefined;
      const assignedProviderAssignedAt = booking.metadata?.['assignedProviderAssignedAt'] as string | undefined;
      
      if (assignedProviderType === 'EXTERNAL') {
        doc.text(`Type: Prestataire externe`, 25, yPos);
        yPos += 7;
        if (assignedProviderName) {
          doc.text(`Nom: ${assignedProviderName}`, 25, yPos);
          yPos += 7;
        }
        if (assignedProviderEmail) {
          doc.text(`Email: ${assignedProviderEmail}`, 25, yPos);
          yPos += 7;
        }
      } else if (booking.providerId) {
        doc.text(`Type: Prestataire enregistré`, 25, yPos);
        yPos += 7;
        if (assignedProviderName) {
          doc.text(`Nom: ${assignedProviderName}`, 25, yPos);
          yPos += 7;
        }
        doc.text(`ID: ${booking.providerId}`, 25, yPos);
        yPos += 7;
      } else {
        doc.text('Prestataire: Non attribué', 25, yPos);
        yPos += 7;
      }
      
      if (assignedProviderAssignedAt) {
        const assignedAt = new Date(assignedProviderAssignedAt).toLocaleString('fr-FR');
        doc.text(`Attribué le: ${assignedAt}`, 25, yPos);
        yPos += 7;
      }
      yPos += 5;
    }
    
    if (parsed.data.elements.includes('paymentInfo')) {
      checkPageBreak(25);
      doc.setFontSize(14);
      doc.text('Informations de paiement', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const totalAmount = booking.metadata?.['totalAmount'] || 0;
      const formattedAmount = typeof totalAmount === 'number' ? totalAmount.toFixed(2) : totalAmount;
      doc.text(`Montant total: ${formattedAmount}€`, 25, yPos);
      yPos += 7;
      const paymentStatus = booking.metadata?.['paymentStatus'] || 'pending';
      const statusLabels: Record<string, string> = {
        'pending': 'En attente',
        'confirmed': 'Confirmé',
        'completed': 'Complété',
        'succeeded': 'Réussi',
        'failed': 'Échoué',
        'cancelled': 'Annulé',
      };
      const statusLabel = statusLabels[paymentStatus] || paymentStatus;
      doc.text(`Statut: ${statusLabel}`, 25, yPos);
      yPos += 7;
      if (booking.metadata?.['paymentIntentId']) {
        doc.text(`ID paiement: ${booking.metadata['paymentIntentId']}`, 25, yPos);
        yPos += 7;
      }
      yPos += 5;
    }
    
    // Ajouter le footer sur la dernière page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      generateJSPDFFooter(doc, i);
    }
    
    // Générer le buffer PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    log.info({ bookingId, elements: parsed.data.elements }, 'Summary PDF generated successfully');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${booking.reservationNumber || bookingId}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params).catch(() => ({ id: 'unknown' }));
    log.error({ error, bookingId: resolvedParams.id }, 'Error generating summary PDF');
    return NextResponse.json(
      { error: 'Erreur lors de la génération du résumé' },
      { status: 500 },
    );
  }
}
