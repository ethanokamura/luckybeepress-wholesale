import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateOrderNumber } from "@/lib/firebase-helpers";

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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment succeeded:", paymentIntent.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment failed:", paymentIntent.id);
      // You could notify the user or update order status here
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata) {
    console.error("No metadata found in session");
    return;
  }

  const checkoutId = metadata.checkoutId;
  const userId = metadata.userId;

  if (!checkoutId) {
    console.error("No checkoutId found in session metadata");
    return;
  }

  // Retrieve checkout data from Firestore
  const checkoutDoc = await adminDb.collection("pending_checkouts").doc(checkoutId).get();
  
  if (!checkoutDoc.exists) {
    console.error(`Pending checkout not found: ${checkoutId}`);
    return;
  }

  const checkoutData = checkoutDoc.data()!;

  // Check if already processed
  if (checkoutData.status === "completed") {
    console.log(`Checkout ${checkoutId} already processed, skipping`);
    return;
  }

  const userEmail = checkoutData.userEmail;
  const notes = checkoutData.notes || null;
  const shippingAddress = checkoutData.shippingAddress || {};
  const billingAddress = checkoutData.billingAddress || {};
  const items = checkoutData.items || [];
  const subtotal = checkoutData.subtotal || 0;
  const discount = checkoutData.discount || 0;

  // Generate order number and ID
  const orderNumber = generateOrderNumber();
  const orderId = `${userId}-${Date.now()}`;

  // Build order items
  const orderItems = items.map(
    (item: {
      productId: string;
      variantId: string | null;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
      image: string | null;
    }) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      name: item.name,
      sku: item.sku || null,
      image: item.image || null,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    })
  );

  // Calculate total
  const shippingCost = 0; // Free shipping
  const tax = 0; // Tax calculation can be added
  const total = subtotal + shippingCost + tax - discount;

  // Create order document
  const order = {
    orderNumber,
    userId,
    userEmail,
    status: "confirmed",
    paymentStatus: "paid",
    items: orderItems,
    shippingAddress,
    billingAddress,
    subtotal,
    shippingCost,
    tax,
    discount,
    total,
    paymentMethod: "card",
    paymentIntentId: session.payment_intent as string,
    stripeSessionId: session.id,
    shipping: null,
    notes,
    adminNotes: null,
    paidAt: new Date(),
    cancelledAt: null,
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    // Save order to Firestore
    await adminDb.collection("orders").doc(orderId).set(order);

    // Clear the user's cart
    await adminDb.collection("carts").doc(userId).delete();

    // Mark the pending checkout as completed
    await adminDb.collection("pending_checkouts").doc(checkoutId).update({
      status: "completed",
      completedAt: new Date(),
      orderId,
    });

    console.log(`Order ${orderNumber} created successfully`);
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

