import { getCartWithItems } from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/queries/catalog";
import { getBuildYourOrderSuggestions } from "@/lib/queries/suggestions";
import { WHOLESALE_PRICING } from "@/lib/db/schema";
import { CartItemRow } from "./cart-item-row";
import { CheckoutForm } from "./checkout-form";
import { EmptyState } from "@/components/shop/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [cart, userAddresses] = await Promise.all([
    getCartWithItems(),
    db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.isDefault), asc(addresses.createdAt)),
  ]);

  if (!cart) redirect("/login");

  // Fetch suggestions if below minimum
  const suggestions = cart.isBelowMinimum
    ? await getBuildYourOrderSuggestions(user.id, 4)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1>Cart</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the catalog to find products for your store."
          actionLabel="Browse catalog"
          actionHref="/catalog"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart items */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {cart.items.map((item) => {
              const unitPrice =
                item.lineItemType === "box_set"
                  ? (item.boxWholesalePrice ?? WHOLESALE_PRICING.BOX_PRICE)
                  : item.wholesalePrice;
              const increment =
                item.lineItemType === "box_set"
                  ? WHOLESALE_PRICING.BOX_MIN_QTY
                  : item.minimumOrderQuantity;

              return (
                <CartItemRow
                  key={item.id}
                  cartItemId={item.id}
                  name={item.productName}
                  slug={item.productSlug}
                  image={item.productImages[0] ?? null}
                  lineItemType={item.lineItemType}
                  quantity={item.quantity}
                  unitPrice={unitPrice}
                  increment={increment}
                  isAvailable={item.isAvailable}
                />
              );
            })}

            {/* Build Your Order suggestions */}
            {cart.isBelowMinimum && suggestions.length > 0 && (
              <div className="mt-4 rounded-xl bg-secondary/60 p-5">
                <h3 className="text-sm font-semibold mb-3">
                  Popular picks to complete your order
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      href={`/catalog/${p.slug}`}
                      className="group/suggest flex flex-col gap-1.5 rounded-lg bg-card p-2 ring-1 ring-foreground/5 transition-all duration-200 hover:ring-primary/20 hover:shadow-sm"
                    >
                      {p.images[0] ? (
                        <div className="aspect-square overflow-hidden rounded-md bg-muted">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={200}
                            height={200}
                            className="size-full object-cover transition-transform duration-300 group-hover/suggest:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-md bg-muted" />
                      )}
                      <p className="text-xs font-medium leading-tight truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatCents(p.wholesalePrice)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <Card className="h-fit lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCents(cart.subtotal)}</span>
                </div>

                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount ({cart.discountPercent}%)</span>
                    <span className="font-mono">−{formatCents(cart.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono">{formatCents(cart.shippingCents)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">
                    {cart.isTaxExempt ? "$0.00 (exempt)" : formatCents(cart.taxAmount)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{formatCents(cart.total)}</span>
                </div>
              </div>

              {/* Minimum indicator */}
              {cart.isBelowMinimum && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    Add {formatCents(cart.minimumCents - cart.subtotal)} more to meet
                    the {formatCents(cart.minimumCents)} minimum
                    {cart.isReturning ? " (returning customer)" : " (first order)"}
                  </AlertDescription>
                </Alert>
              )}

              <CheckoutForm
                addresses={userAddresses}
                isNet30Eligible={cart.isNet30Eligible}
                isBelowMinimum={cart.isBelowMinimum}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
