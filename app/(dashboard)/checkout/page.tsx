"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/firebase-helpers";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { AddressForm } from "@/components/shared/AddressForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Cart, OrderAddress } from "@/types";
import Image from "next/image";
import { Lock, CreditCard } from "lucide-react";

const MINIMUM_ORDER_AMOUNT = 15000; // $150.00 in cents

export default function CheckoutPage() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"shipping" | "billing" | "review">(
    "shipping"
  );
  const [shippingAddress, setShippingAddress] = useState<OrderAddress | null>(
    null
  );
  const [billingAddress, setBillingAddress] = useState<OrderAddress | null>(
    null
  );
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      try {
        const cartRef = doc(db, "carts", firebaseUser.uid);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          setCart({ id: cartSnap.id, ...cartSnap.data() } as Cart);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [firebaseUser]);

  const handleShippingSubmit = (address: OrderAddress) => {
    setShippingAddress(address);
    if (sameAsShipping) {
      setBillingAddress(address);
      setStep("review");
    } else {
      setStep("billing");
    }
  };

  const handleBillingSubmit = (address: OrderAddress) => {
    setBillingAddress(address);
    setStep("review");
  };

  const handleStripeCheckout = async () => {
    if (!firebaseUser || !cart || !shippingAddress || !billingAddress) return;

    // Final check for minimum order amount
    if (cart.subtotal < MINIMUM_ORDER_AMOUNT) {
      alert(
        `Minimum order amount is ${formatPrice(
          MINIMUM_ORDER_AMOUNT
        )}. Please add more items to your cart.`
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.items,
          shippingAddress,
          billingAddress,
          userId: firebaseUser.uid,
          userEmail: firebaseUser.email || "",
          notes: notes || "",
          subtotal: cart.subtotal,
          discount: cart.discount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded w-32 mb-8" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </AuthGuard>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-7xl mx-auto text-center py-16">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before checking out.
          </p>
          <Button onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </AuthGuard>
    );
  }

  // Redirect to cart if subtotal is below minimum
  if (cart.subtotal < MINIMUM_ORDER_AMOUNT) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-7xl mx-auto text-center py-16">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Minimum Order Not Met</h1>
          <p className="text-muted-foreground mb-6">
            The minimum order amount is {formatPrice(MINIMUM_ORDER_AMOUNT)}.
            Your current cart total is {formatPrice(cart.subtotal)}.
            <br />
            Please add {formatPrice(MINIMUM_ORDER_AMOUNT - cart.subtotal)} more
            to proceed.
          </p>
          <Button onClick={() => router.push("/cart")}>Return to Cart</Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth requireApproval>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {["shipping", "billing", "review"].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : index < ["shipping", "billing", "review"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">
                {s === "billing" && sameAsShipping ? "Billing (Same)" : s}
              </span>
              {index < 2 && (
                <div className="w-8 h-0.5 bg-muted mx-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="rounded"
                    />
                    Billing address same as shipping
                  </label>
                </div>
                <AddressForm
                  onSubmit={handleShippingSubmit}
                  submitLabel="Continue"
                />
              </div>
            )}

            {step === "billing" && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Billing Address</h2>
                <AddressForm
                  onSubmit={handleBillingSubmit}
                  onCancel={() => setStep("shipping")}
                  submitLabel="Continue to Review"
                />
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                {/* Addresses Review */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">Shipping Address</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("shipping")}
                    >
                      Edit
                    </Button>
                  </div>
                  {shippingAddress && (
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </p>
                      {shippingAddress.company && (
                        <p>{shippingAddress.company}</p>
                      )}
                      <p>{shippingAddress.street1}</p>
                      {shippingAddress.street2 && (
                        <p>{shippingAddress.street2}</p>
                      )}
                      <p>
                        {shippingAddress.city}, {shippingAddress.state}{" "}
                        {shippingAddress.postalCode}
                      </p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Order Notes (Optional)
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any special instructions or notes for your order..."
                    className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </div>

                {/* Items Review */}
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Order Items</h2>
                  <div className="space-y-3">
                    {cart.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proceed to Payment */}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleStripeCheckout}
                  disabled={submitting}
                >
                  {submitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                  <Lock className="w-3 h-3" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Subtotal ({cart.itemCount} items)
                  </span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(cart.subtotal - cart.discount)}</span>
                </div>
              </div>

              {/* Stripe Badge */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Secure checkout with Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
