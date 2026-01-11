"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/firebase-helpers";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { CartItemRow } from "@/components/shared/CartItemRow";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Cart, CartItem } from "@/types";
import Image from "next/image";

const MINIMUM_ORDER_AMOUNT = 15000; // $150.00 in cents

export default function CartPage() {
  const { firebaseUser } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    const cartRef = doc(db, "carts", firebaseUser.uid);
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      if (snapshot.exists()) {
        setCart({ id: snapshot.id, ...snapshot.data() } as Cart);
      } else {
        setCart(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const updateCart = async (items: CartItem[]) => {
    if (!firebaseUser) return;

    setUpdating(true);
    try {
      const cartRef = doc(db, "carts", firebaseUser.uid);
      await updateDoc(cartRef, {
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (!cart) return;
    const updatedItems = [...cart.items];
    updatedItems[index].quantity = quantity;
    updateCart(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    if (!cart) return;
    const updatedItems = cart.items.filter((_, i) => i !== index);
    updateCart(updatedItems);
  };

  if (loading) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-muted animate-pulse rounded w-32 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <AuthGuard requireAuth requireApproval>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Your Cart</h1>

        {isEmpty ? (
          <div className="text-center py-16">
            <Image
              src="/logo.svg"
              alt="Lucky Bee Press"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our collection and add some cards to your cart.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-card border rounded-lg p-4">
                {cart.items.map((item, index) => (
                  <CartItemRow
                    key={`${item.productId}-${index}`}
                    item={item}
                    onUpdateQuantity={(qty) => handleUpdateQuantity(index, qty)}
                    onRemove={() => handleRemoveItem(index)}
                    disabled={updating}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
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
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(cart.subtotal - cart.discount)}</span>
                  </div>
                </div>

                {cart.subtotal < MINIMUM_ORDER_AMOUNT && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Minimum order amount is {formatPrice(MINIMUM_ORDER_AMOUNT)}. 
                      Add {formatPrice(MINIMUM_ORDER_AMOUNT - cart.subtotal)} more to checkout.
                    </p>
                  </div>
                )}

                <Link 
                  href="/checkout" 
                  className={`block mt-6 ${cart.subtotal < MINIMUM_ORDER_AMOUNT ? 'pointer-events-none' : ''}`}
                >
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={cart.subtotal < MINIMUM_ORDER_AMOUNT}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link href="/products" className="block mt-3">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
