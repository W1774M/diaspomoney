import { paymentEvents } from "@/lib/events";
import { childLogger } from "@/lib/logger";
import { verifyStripeSignature } from "@/lib/stripe-server";
import type { StripePaymentIntent } from "@/lib/types";
import { confirmBookingPaymentService } from "@/services/booking/confirm-booking-payment.service";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 },
      );
    }

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

        const bookingId = pi.metadata?.["bookingId"];
        if (bookingId) {
          const result = await confirmBookingPaymentService.execute({
            proofId: pi.id,
            bookingId,
            expectedAmount: pi.amount / 100,
            expectedCurrency: pi.currency.toUpperCase(),
            acceptProcessing: false,
          });

          if (!result.success) {
            log.warn(
              { bookingId, paymentIntentId: pi.id, error: result.error },
              "ConfirmBookingPayment failed from payment_intent.succeeded",
            );
          } else {
            log.info(
              { bookingId, paymentIntentId: pi.id, emailSent: result.emailSent },
              "Booking payment confirmed via ConfirmBookingPayment",
            );
          }
        } else {
          // Pas de booking lié — event bus uniquement (analytics / notif générique)
          await paymentEvents
            .emitPaymentSucceeded({
              transactionId: pi.id,
              amount: pi.amount / 100,
              currency: pi.currency.toUpperCase(),
              userId:
                (pi.metadata?.["userId"] as string) ||
                (typeof pi.customer === "string"
                  ? pi.customer
                  : pi.customer?.id || "unknown") ||
                "unknown",
              provider: "STRIPE",
              timestamp: new Date(),
            })
            .catch((error) => {
              log.error({
                err: error,
                msg: "Error emitting payment succeeded event",
              });
            });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as StripePaymentIntent;
        log.warn({
          msg: "Payment failed",
          error: pi?.last_payment_error,
          paymentIntentId: pi?.id,
        });

        await paymentEvents
          .emitPaymentFailed(
            pi.id || "unknown",
            pi?.last_payment_error?.message || "Payment failed",
          )
          .catch((error) => {
            log.error({
              err: error,
              msg: "Error emitting payment failed event",
            });
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

        const bookingId = session.metadata?.["bookingId"];
        if (bookingId && session.payment_status === "paid") {
          const result = await confirmBookingPaymentService.execute({
            proofId: session.id,
            bookingId,
            ...(session.amount_total != null
              ? { expectedAmount: session.amount_total / 100 }
              : {}),
            expectedCurrency: (session.currency || "eur").toUpperCase(),
            acceptProcessing: false,
          });

          if (!result.success) {
            log.warn(
              { bookingId, sessionId: session.id, error: result.error },
              "ConfirmBookingPayment failed from checkout.session.completed",
            );
          } else {
            log.info(
              {
                bookingId,
                sessionId: session.id,
                emailSent: result.emailSent,
              },
              "Booking payment confirmed via ConfirmBookingPayment (checkout)",
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
