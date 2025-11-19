/**
 * Commands Index
 * 
 * Export centralisé de toutes les commandes disponibles
 */

// Base
export { BaseCommand, CommandHandler } from './base.command';
export type { Command, CommandResult } from './base.command';

// Payment Commands
export {
  ConfirmPaymentCommand, CreatePaymentCommand,
} from './payment.commands';

// Booking Commands
export {
  CancelBookingCommand, CreateBookingCommand, UpdateBookingStatusCommand,
} from './booking.commands';

// Transaction Commands
export {
  CreateTransactionCommand, RefundTransactionCommand, UpdateTransactionStatusCommand,
} from './transaction.commands';

// Instance singleton du CommandHandler
import { CommandHandler } from './base.command';
export const commandHandler = new CommandHandler(100);

