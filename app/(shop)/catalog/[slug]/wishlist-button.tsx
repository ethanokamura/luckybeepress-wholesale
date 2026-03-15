"use client";

import { useTransition, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { Heart } from "lucide-react";

export function WishlistButton({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(initialWishlisted);
  const iconRef = useRef<SVGSVGElement>(null);

  function handleToggle() {
    iconRef.current?.classList.remove("heart-pop");
    iconRef.current?.getBoundingClientRect();
    iconRef.current?.classList.add("heart-pop");
    setAdded((prev) => !prev);
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.added !== undefined) {
        setAdded(result.added);
      }
    });
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={pending}
      className={added ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10" : ""}
    >
      <Heart
        ref={iconRef}
        data-icon="inline-start"
        className={`transition-colors duration-200 ${added ? "fill-current" : ""}`}
      />
      {added ? "Saved to Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
