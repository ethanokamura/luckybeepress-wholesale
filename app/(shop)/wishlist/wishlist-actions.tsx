"use client";

import { useTransition } from "react";
import { removeFromWishlist, moveToCart } from "@/lib/actions/wishlist";
import { Button } from "@/components/ui/button";

export function WishlistActions({
  wishlistItemId,
  isAvailable,
}: {
  wishlistItemId: string;
  isAvailable: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {isAvailable && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => { await moveToCart(wishlistItemId); })
          }
        >
          Move to Cart
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => { await removeFromWishlist(wishlistItemId); })
        }
      >
        Remove
      </Button>
    </div>
  );
}
