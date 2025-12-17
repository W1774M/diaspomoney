import { paymentEvents } from "@/lib/events";
import { childLogger } from "@/lib/logger";
import { verifyStripeSignature } from "@/lib/stripe-server";
import type { StripePaymentIntent } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { bookingService } from "@/services/booking/booking.service";
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 },
      );
    }

    // Next.js request cloning to get raw body
    const rawBody = Buffer.from(await req.arrayBuffer());
    const signature = req.headers.get("stripe-signature");

    const event = verifyStripeSignature({
      rawBody,
      signature,
      webhookSecret,
    });

    const reqId = req.headers.get("x-request-id");
    const log = childLogger({
      requestId: reqId || undefined,
      route: "stripe/webhook",
    });
    log.info({ msg: "Stripe webhook received", type: event.type });

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as StripePaymentIntent;
        log.info({
          msg: "Payment succeeded",
          paymentIntentId: pi.id,
          metadata: pi.metadata,
        });

        // Émettre un événement via EventBus
        await paymentEvents.emitPaymentSucceeded({
          transactionId: pi.id,
          amount: pi.amount / 100, // Convertir de centimes
          currency: pi.currency.toUpperCase(),
          userId: (pi.metadata?.['userId'] as string) || (typeof pi.customer === 'string' ? pi.customer : pi.customer?.id || 'unknown') || 'unknown',
          provider: 'STRIPE',
          timestamp: new Date(),
        }).catch(error => {
          log.error({ err: error, msg: "Error emitting payment succeeded event" });
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as StripePaymentIntent;
        log.warn({
          msg: "Payment failed",
          error: pi?.last_payment_error,
          paymentIntentId: pi?.id,
        });

        // Émettre un événement via EventBus
        await paymentEvents.emitPaymentFailed(
          pi.id || 'unknown',
          pi?.last_payment_error?.message || 'Payment failed',
        ).catch(error => {
          log.error({ err: error, msg: "Error emitting payment failed event" });
        });
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log.info({
          msg: "Checkout session completed",
          sessionId: session.id,
          metadata: session.metadata,
        });

        // Mettre à jour le booking si un bookingId est présent dans les métadonnées
        const bookingId = session.metadata?.["bookingId"];
        if (bookingId) {
          try {
            // Récupérer le booking
            const booking = await bookingService.getBookingById(bookingId);
            if (booking) {
              const metadata = booking.metadata || {};
              const progressHistory = (metadata['progressHistory'] as any[]) || [];
              
              // Mettre à jour le statut de paiement
              const updatedMetadata: Record<string, any> = {
                ...metadata,
                paymentStatus: 'confirmed',
                paymentPending: false,
                paymentConfirmedAt: new Date().toISOString(),
                checkoutSessionId: session.id,
                paymentIntentId: session.payment_intent as string || metadata['paymentIntentId'],
              };

              // Marquer l'étape 3 comme complétée dans progressHistory
              const step3History = progressHistory.find((h: any) => h.step === 3);
              if (step3History) {
                const updatedStep3History = {
                  ...step3History,
                  completed: true,
                  paymentConfirmedAt: new Date().toISOString(),
                  data: {
                    ...step3History.data,
                    paymentPending: false,
                    paymentConfirmed: true,
                  },
                };

                const updatedProgressHistory = progressHistory.map((h: any) =>
                  h.step === 3 ? updatedStep3History : h
                );

                updatedMetadata['progressHistory'] = updatedProgressHistory;
              }

              // Mettre à jour le booking
              await bookingService.updateBooking(bookingId, {
                metadata: updatedMetadata,
              });

              log.info(
                { bookingId, sessionId: session.id },
                'Booking payment status updated to confirmed after checkout session completion',
              );
            } else {
              log.warn({ bookingId }, 'Booking not found for checkout session');
            }
          } catch (error) {
            log.error(
              { error, bookingId, sessionId: session.id },
              'Error updating booking payment status from checkout session',
            );
          }
        }
        break;
      }
      default: {
        // Ignore unhandled events for now
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    const reqId = req.headers.get("x-request-id");
    const log = childLogger({
      requestId: reqId || undefined,
      route: "stripe/webhook",
    });
    log.error({ err: error, msg: "Webhook handling error" });
    return NextResponse.json(
      { error: error?.message || "Webhook handling error" },
      { status: 400 },
    );
  }
}
