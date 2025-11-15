import { paymentEvents } from "@/lib/events";
import { childLogger } from "@/lib/logger";
import { verifyStripeSignature } from "@/lib/stripe-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // disable caching for webhooks

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
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
        const pi = event.data.object as any;
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
          userId: pi.metadata?.userId || pi.customer || 'unknown',
          provider: 'STRIPE',
          timestamp: new Date(),
        }).catch(error => {
          log.error({ err: error, msg: "Error emitting payment succeeded event" });
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as any;
        log.warn({
          msg: "Payment failed",
          error: pi?.last_payment_error,
          paymentIntentId: pi?.id,
        });

        // Émettre un événement via EventBus
        await paymentEvents.emitPaymentFailed(
          pi.id || 'unknown',
          pi?.last_payment_error?.message || 'Payment failed'
        ).catch(error => {
          log.error({ err: error, msg: "Error emitting payment failed event" });
        });
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
      { status: 400 }
    );
  }
}
