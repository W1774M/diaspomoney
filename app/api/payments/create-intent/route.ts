import { childLogger } from "@/lib/logger";
import { createPaymentIntent } from "@/lib/stripe-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "eur", email, metadata } = body || {};

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount (minor units)" },
        { status: 400 }
      );
    }

    const intent = await createPaymentIntent({
      amountInMinorUnit: amount,
      currency,
      customerEmail: email,
      metadata,
    });

    const res = NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      currency: intent.currency,
      amount: intent.amount,
      status: intent.status,
    });
    const reqId = req.headers.get("x-request-id");
    const log = childLogger({
      requestId: reqId || undefined,
      route: "payments/create-intent",
    });
    log.info({
      msg: "PaymentIntent created",
      amount,
      currency,
      email,
      paymentIntentId: intent.id,
    });
    return res;
  } catch (error: any) {
    const reqId = req.headers.get("x-request-id");
    const log = childLogger({
      requestId: reqId || undefined,
      route: "payments/create-intent",
    });
    log.error({ err: error, msg: "Failed to create PaymentIntent" });
    return NextResponse.json(
      { error: error?.message || "Failed to create PaymentIntent" },
      { status: 500 }
    );
  }
}
