"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types";
import Image from "next/image";
import { formatPrice } from "@/lib/firebase-helpers";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";

function CheckoutSuccessContent() {
  const { firebaseUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const cartCleared = useRef(false);
  const maxRetries = 10; // Try for up to ~30 seconds

  // Clear cart when order is confirmed (backup in case webhook is slow)
  useEffect(() => {
    const clearCart = async () => {
      if (!firebaseUser || cartCleared.current) return;
      
      // Only clear cart once and only when we have session confirmation
      if (sessionId && !loading) {
        cartCleared.current = true;
        try {
          // Delete the user's cart document
          await deleteDoc(doc(db, "carts", firebaseUser.uid));
          console.log("Cart cleared successfully");
        } catch (error) {
          // Cart might already be cleared by webhook - that's fine
          console.log("Cart clear skipped (may already be cleared):", error);
        }
      }
    };

    clearCart();
  }, [firebaseUser, sessionId, loading]);

  const fetchOrder = useCallback(async (): Promise<Order | null> => {
    if (!firebaseUser || !sessionId) {
      return null;
    }

    try {
      // Find order by Stripe session ID - ONLY match the exact session
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", firebaseUser.uid),
        where("stripeSessionId", "==", sessionId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0];
        return { id: orderDoc.id, ...orderDoc.data() } as Order;
      }
      
      // Order not found yet - webhook may still be processing
      return null;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  }, [firebaseUser, sessionId]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const attemptFetch = async () => {
      if (!mounted) return;
      
      const foundOrder = await fetchOrder();
      
      if (foundOrder) {
        setOrder(foundOrder);
        setLoading(false);
      } else if (retryCount < maxRetries) {
        // Retry after 3 seconds
        timeoutId = setTimeout(() => {
          if (mounted) {
            setRetryCount(prev => prev + 1);
          }
        }, 3000);
      } else {
        // Max retries reached - stop loading but don't show wrong order
        setLoading(false);
      }
    };

    // Initial delay to give webhook time to process
    const initialDelay = retryCount === 0 ? 2000 : 0;
    timeoutId = setTimeout(attemptFetch, initialDelay);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchOrder, retryCount]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <Loader2 className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Processing Your Order...
          </h1>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment.
            {retryCount > 0 && (
              <span className="block text-sm mt-2">
                Checking... ({retryCount}/{maxRetries})
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Order not found after retries - show success but without specific order details
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your payment was processed successfully.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Your order is being prepared and will appear in your orders shortly.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A confirmation email will be sent to your email address.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push("/orders")}
              className="gap-2"
            >
              View My Orders
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/products")}
            >
              Continue Shopping
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={48}
            height={48}
            className="mx-auto opacity-50"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Thank You for Your Order!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your payment was successful and your order has been confirmed.
        </p>
      </div>

      {order && (
        <div className="bg-card border rounded-lg p-6 mb-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Order Details</h2>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize text-green-600 dark:text-green-400 font-medium">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span>{order.items?.length || 0} item(s)</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Total Paid</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your email address.
          <br />
          You can track your order status from your account.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order && (
            <Button
              onClick={() => router.push(`/orders/${order.id}`)}
              className="gap-2"
            >
              View Order Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/orders")}
          >
            View All Orders
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/products")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <Image
          src="/logo.svg"
          alt="Lucky Bee Press"
          width={48}
          height={48}
          className="mx-auto opacity-50"
        />
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <AuthGuard requireAuth requireApproval>
      <Suspense fallback={
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
            <div className="h-8 bg-muted rounded w-64 mx-auto" />
          </div>
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
    </AuthGuard>
  );
}

