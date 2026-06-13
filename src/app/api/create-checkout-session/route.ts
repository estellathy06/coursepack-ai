import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { planType } = await req.json();

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("[Stripe API] Missing STRIPE_SECRET_KEY environment variable.");
      return NextResponse.json(
        { error: "Stripe configuration error", message: "Stripe Secret Key is missing on the server." },
        { status: 500 }
      );
    }

    const stripeSinglePackPriceId = process.env.STRIPE_SINGLE_PACK_PRICE_ID;
    const stripeFinalsPassPriceId = process.env.STRIPE_FINALS_PASS_PRICE_ID;

    // Resolve Price ID
    let priceId = "";
    if (planType === "single") {
      priceId = stripeSinglePackPriceId || "";
    } else if (planType === "semester") {
      priceId = stripeFinalsPassPriceId || "";
    }

    if (!priceId) {
      console.error(`[Stripe API] Price ID missing for plan type: ${planType}`);
      return NextResponse.json(
        { error: "Stripe configuration error", message: `Stripe Price ID is not configured for plan: ${planType}` },
        { status: 500 }
      );
    }

    // Resolve application URL for success and cancel redirections
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.accredited" as any, // Cast or use fallback to compile nicely
    });

    console.log(`[Stripe API] Creating checkout session for planType: ${planType}, priceId: ${priceId}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout session URL.");
    }

    return NextResponse.json({ success: true, url: session.url });

  } catch (error: any) {
    console.error("[Stripe API] Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", message: error.message },
      { status: 500 }
    );
  }
}
