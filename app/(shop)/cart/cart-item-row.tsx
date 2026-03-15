"use client";

import { useTransition } from "react";
import { updateCartQuantity, removeFromCart } from "@/lib/actions/cart";
import { formatCents } from "@/lib/utils/format";
import { QuantityInput } from "@/components/shop/quantity-input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export function CartItemRow({
  cartItemId,
  name,
  slug,
  image,
  lineItemType,
  quantity,
  unitPrice,
  increment,
  isAvailable,
}: {
  cartItemId: string;
  name: string;
  slug: string;
  image: string | null;
  lineItemType: "single" | "box_set";
  quantity: number;
  unitPrice: number;
  increment: number;
  isAvailable: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleQuantityChange(next: number) {
    startTransition(async () => { await updateCartQuantity(cartItemId, next); });
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors duration-200 hover:border-primary/15">
      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {image ? (
          <Image src={image} alt={name} width={80} height={80} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/catalog/${slug}`} className="font-medium hover:underline truncate block">
          {name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {lineItemType === "box_set" ? "Box set" : "Singles"} &middot;{" "}
          {formatCents(unitPrice)} each
        </p>
        {!isAvailable && (
          <Badge variant="destructive" className="mt-1">
            Unavailable — remove from cart
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <QuantityInput
          value={quantity}
          increment={increment}
          onChange={handleQuantityChange}
          disabled={pending}
          min={increment}
        />

        <span className="w-20 text-right text-sm font-semibold font-mono">
          {formatCents(unitPrice * quantity)}
        </span>

        <button
          onClick={() => startTransition(async () => { await removeFromCart(cartItemId); })}
          disabled={pending}
          className="text-xs text-destructive hover:text-destructive/80 ml-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
