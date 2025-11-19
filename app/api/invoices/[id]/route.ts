import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer et mettre à jour une facture par ID
 * Implémente le Service Layer Pattern via InvoiceService
 * Utilise les decorators (@Log, @Cacheable, @Validate, @InvalidateCache) via le service
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/invoices/[id]' });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const invoiceId = params.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      log.warn({ invoiceId, msg: 'Invalid invoice ID format' });
      return NextResponse.json(
        { error: 'ID de facture invalide' },
        { status: 400 },
      );
    }

    // Utiliser le Service Layer Pattern (InvoiceService utilise déjà Repository Pattern)
    // Le service a déjà les decorators @Log, @Cacheable, @Validate
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    // Vérifier que l'utilisateur a accès à cette facture
    // (soit il est le propriétaire, soit il est admin)
    const isOwner = invoice.userId === userId;
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      log.warn({
        userId,
        invoiceId,
        msg: 'Unauthorized access to invoice',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 },
      );
    }

    // Transformer le format Invoice (repository) vers IInvoice (frontend)
    // Récupérer les données complètes depuis MongoDB si nécessaire
    const Invoice = (await import('@/models/Invoice')).default;
    const invoiceDoc = await (Invoice as any)
      .findById(new mongoose.Types.ObjectId(invoiceId))
      .lean();

    // Mapper vers le format IInvoice attendu par le frontend
    const iInvoice = {
      _id: invoice.id || invoice._id || invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.userId, // userId du repository = customerId pour IInvoice
      providerId:
        invoiceDoc?.['providerId'] || invoice.metadata?.['providerId'] || '',
      amount: invoice.amount,
      currency: invoice.currency || 'EUR',
      status: invoice.status, // Le repository fait déjà le mapping
      issueDate: invoiceDoc?.['issueDate'] || invoice.createdAt,
      dueDate: invoice.dueDate || invoiceDoc?.['dueDate'],
      paidDate: invoice.paidAt || invoiceDoc?.['paidDate'],
      paymentDate: invoice.paidAt || invoiceDoc?.['paymentDate'],
      items: invoice.items || [],
      notes: invoiceDoc?.['notes'] || invoice.metadata?.['notes'],
      userId: invoice.userId,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    log.info({
      invoiceId,
      userId,
      msg: 'Invoice retrieved successfully',
    });

    return NextResponse.json({
      success: true,
      invoice: iInvoice,
    });
  } catch (error) {
    log.error({ error, invoiceId: params.id, msg: 'Error fetching invoice' });

    if (error instanceof Error && error.message === 'Facture non trouvée') {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 },
    );
  }
}

/**
 * Handler PUT pour mettre à jour une facture
 * Utilise InvoiceService.updateInvoice() qui a les decorators @InvalidateCache
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/invoices/[id]' });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const invoiceId = params.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      log.warn({ invoiceId, msg: 'Invalid invoice ID format' });
      return NextResponse.json(
        { error: 'ID de facture invalide' },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur est admin (seuls les admins peuvent modifier)
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isAdmin) {
      log.warn({
        userId,
        invoiceId,
        msg: 'Unauthorized update attempt (non-admin)',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin uniquement' },
        { status: 403 },
      );
    }

    // Récupérer les données de la requête
    const body = await request.json();

    // Préparer les données de mise à jour
    const updateData: Partial<
      import('@/services/invoice/invoice.service').InvoiceData
    > = {
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.currency && { currency: body.currency }),
      ...(body.items && { items: body.items }),
      ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
      ...(body.tax !== undefined && { tax: body.tax }),
    };

    // Utiliser le Service Layer Pattern (InvoiceService utilise déjà Repository Pattern)
    // Le service a déjà les decorators @InvalidateCache, @Log
    await invoiceService.updateInvoice(invoiceId, updateData);

    // Mettre à jour les champs supplémentaires via le repository directement
    // (invoiceNumber, status, issueDate, paidDate, notes, providerId)
    const Invoice = (await import('@/models/Invoice')).default;
    const additionalUpdates: any = {};
    if (body.invoiceNumber)
      additionalUpdates.invoiceNumber = body.invoiceNumber;
    if (body.status) additionalUpdates.status = body.status;
    if (body.issueDate) additionalUpdates.issueDate = new Date(body.issueDate);
    if (body.paidDate) additionalUpdates.paidDate = new Date(body.paidDate);
    if (body.notes !== undefined) additionalUpdates.notes = body.notes;
    if (body.providerId !== undefined)
      additionalUpdates.providerId = body.providerId;

    if (Object.keys(additionalUpdates).length > 0) {
      await (Invoice as any).findByIdAndUpdate(
        new mongoose.Types.ObjectId(invoiceId),
        { $set: additionalUpdates },
        { new: true },
      );
    }

    // Récupérer la facture mise à jour complète
    const finalInvoice = await invoiceService.getInvoiceById(invoiceId);
    const invoiceDoc = await (Invoice as any)
      .findById(new mongoose.Types.ObjectId(invoiceId))
      .lean();

    // Mapper vers le format IInvoice attendu par le frontend
    const iInvoice = {
      _id: finalInvoice.id || finalInvoice._id || invoiceId,
      invoiceNumber:
        invoiceDoc?.['invoiceNumber'] || finalInvoice.invoiceNumber,
      customerId: finalInvoice.userId,
      providerId: invoiceDoc?.['providerId'] || body.providerId || '',
      amount: finalInvoice.amount,
      currency: finalInvoice.currency || 'EUR',
      status: invoiceDoc?.['status'] || finalInvoice.status,
      issueDate: invoiceDoc?.['issueDate'] || finalInvoice.createdAt,
      dueDate: finalInvoice.dueDate || invoiceDoc?.['dueDate'],
      paidDate: invoiceDoc?.['paidDate'] || finalInvoice.paidAt,
      paymentDate: invoiceDoc?.['paymentDate'] || finalInvoice.paidAt,
      items: finalInvoice.items || [],
      notes: invoiceDoc?.['notes'] || body.notes,
      userId: finalInvoice.userId,
      createdAt: finalInvoice.createdAt,
      updatedAt: finalInvoice.updatedAt,
    };

    log.info({
      invoiceId,
      userId,
      msg: 'Invoice updated successfully',
    });

    return NextResponse.json({
      success: true,
      invoice: iInvoice,
    });
  } catch (error) {
    log.error({
      error,
      invoiceId: params.id,
      msg: 'Error updating invoice',
    });

    if (error instanceof Error && error.message === 'Facture non trouvée') {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la facture' },
      { status: 500 },
    );
  }
}
