/**
 * Booking Commands - Command Pattern Implementation
 * 
 * Commandes pour les opérations de réservation
 */

import { bookingFacade, BookingFacadeData, BookingFacadeResult } from '@/facades/booking.facade';
import { logger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { BaseCommand } from './base.command';

/**
 * Commande pour créer une réservation avec paiement
 */
export class CreateBookingCommand extends BaseCommand<BookingFacadeResult> {
  protected commandName = 'CreateBooking';
  protected commandData: BookingFacadeData;
  private executedResult?: BookingFacadeResult;

  constructor(data: BookingFacadeData) {
    super();
    this.commandData = data;
  }

  async execute(): Promise<BookingFacadeResult> {
    const result = await bookingFacade.createBookingWithPayment(this.commandData);
    this.executedResult = result;
    return result;
  }

  async undo(): Promise<void> {
    if (!this.executedResult?.booking) {
      logger.warn({
        command: this.commandName,
      }, 'Cannot undo booking: booking not found');
      return;
    }

    try {
      const bookingId = this.executedResult.booking.id || 
                       (this.executedResult.booking as any)._id?.toString() || '';

      if (!bookingId) {
        throw new Error('Booking ID not found');
      }

      // Annuler la réservation
      await bookingService.updateBookingStatus(bookingId, 'CANCELLED');

      // Si un paiement a été effectué, le rembourser
      if (this.executedResult.paymentResult?.success && 
          this.executedResult.paymentResult.transactionId) {
        const { transactionService } = await import('@/services/transaction/transaction.service');
        await transactionService.refundTransaction(
          this.executedResult.paymentResult.transactionId,
          undefined as any,
          'Booking cancelled',
          undefined as any,
        );
      }

      logger.info({
        command: this.commandName,
        bookingId,
      }, 'Booking undone: booking cancelled and payment refunded');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        bookingId: this.executedResult?.booking?.id,
      }, 'Failed to undo booking');
      throw error;
    }
  }
}

/**
 * Commande pour annuler une réservation
 */
export class CancelBookingCommand extends BaseCommand<boolean> {
  protected commandName = 'CancelBooking';
  protected commandData: {
    bookingId: string;
    reason?: string;
  };
  private previousStatus?: string;

  constructor(bookingId: string, reason?: string) {
    super();
    this.commandData = {
      bookingId,
      ...(reason !== undefined && { reason }),
    };
  }

  async execute(): Promise<boolean> {
    try {
      // Récupérer le statut actuel avant annulation
      const booking = await bookingService.getBookingById(this.commandData.bookingId);
      this.previousStatus = booking.status;

      // Annuler la réservation
      const result = await bookingService.updateBookingStatus(
        this.commandData.bookingId,
        'CANCELLED',
      );

      return result;
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        bookingId: this.commandData.bookingId,
      }, 'Failed to cancel booking');
      throw error;
    }
  }

  async undo(): Promise<void> {
    if (!this.previousStatus) {
      logger.warn({
        command: this.commandName,
        bookingId: this.commandData.bookingId,
      }, 'Cannot undo cancellation: previous status not found');
      return;
    }

    try {
      // Restaurer le statut précédent
      await bookingService.updateBookingStatus(
        this.commandData.bookingId,
        this.previousStatus as any,
      );

      logger.info({
        command: this.commandName,
        bookingId: this.commandData.bookingId,
        previousStatus: this.previousStatus,
      }, 'Booking cancellation undone: status restored');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        bookingId: this.commandData.bookingId,
      }, 'Failed to undo booking cancellation');
      throw error;
    }
  }
}

/**
 * Commande pour mettre à jour le statut d'une réservation
 */
export class UpdateBookingStatusCommand extends BaseCommand<boolean> {
  protected commandName = 'UpdateBookingStatus';
  protected commandData: {
    bookingId: string;
    newStatus: string;
  };
  private previousStatus?: string;

  constructor(bookingId: string, newStatus: string) {
    super();
    this.commandData = {
      bookingId,
      newStatus,
    };
  }

  async execute(): Promise<boolean> {
    try {
      // Récupérer le statut actuel
      const booking = await bookingService.getBookingById(this.commandData.bookingId);
      this.previousStatus = booking.status;

      // Mettre à jour le statut
      const result = await bookingService.updateBookingStatus(
        this.commandData.bookingId,
        this.commandData.newStatus as any,
      );

      return result;
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        bookingId: this.commandData.bookingId,
      }, 'Failed to update booking status');
      throw error;
    }
  }

  async undo(): Promise<void> {
    if (!this.previousStatus) {
      logger.warn({
        command: this.commandName,
        bookingId: this.commandData.bookingId,
      }, 'Cannot undo status update: previous status not found');
      return;
    }

    try {
      // Restaurer le statut précédent
      await bookingService.updateBookingStatus(
        this.commandData.bookingId,
        this.previousStatus as any,
      );

      logger.info({
        command: this.commandName,
        bookingId: this.commandData.bookingId,
        previousStatus: this.previousStatus,
        newStatus: this.commandData.newStatus,
      }, 'Booking status update undone: status restored');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        bookingId: this.commandData.bookingId,
      }, 'Failed to undo booking status update');
      throw error;
    }
  }
}

