import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CartItem, OrderAddress } from "@/types";

// Initialize Firebase Admin (for server-side operations)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDb = getFirestore();

interface CheckoutRequestBody {
  items: CartItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  userId: string;
  userEmail: string;
  notes?: string;
  subtotal: number;
  discount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get base URL from request or environment
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const body: CheckoutRequestBody = await request.json();
    const {
      items,
      shippingAddress,
      billingAddress,
      userId,
      userEmail,
      notes,
      subtotal,
      discount,
    } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !billingAddress) {
      return NextResponse.json(
        { error: "Shipping and billing addresses are required" },
        { status: 400 }
      );
    }

    // Generate a unique checkout ID
    const checkoutId = `checkout_${userId}_${Date.now()}`;

    // Store checkout data in Firestore (to avoid Stripe metadata limits)
    const checkoutData = {
      userId,
      userEmail,
      notes: notes || null,
      shippingAddress,
      billingAddress,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.name,
        sku: item.sku || null,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null,
      })),
      subtotal,
      discount,
      createdAt: new Date(),
      status: "pending",
    };

    await adminDb.collection("pending_checkouts").doc(checkoutId).set(checkoutData);

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : undefined,
          },
          unit_amount: item.price, // Already in cents
        },
        quantity: item.quantity,
      })
    );

    // Handle discount with Stripe coupon if applicable
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (discount > 0) {
      // Create an inline coupon for the discount amount
      const coupon = await stripe.coupons.create({
        amount_off: discount,
        currency: "usd",
        name: "Order Discount",
        duration: "once",
      });
      discounts = [{ coupon: coupon.id }];
    }

    // Create Stripe checkout session with minimal metadata (just reference ID)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      discounts,
      customer_email: userEmail,
      client_reference_id: userId,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      billing_address_collection: "required",
      metadata: {
        checkoutId, // Reference to Firestore document with full checkout data
        userId,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    // Update the pending checkout with the session ID
    await adminDb.collection("pending_checkouts").doc(checkoutId).update({
      stripeSessionId: session.id,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

