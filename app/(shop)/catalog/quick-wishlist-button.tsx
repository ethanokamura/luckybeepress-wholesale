"use client";

import { useTransition, useRef, useState } from "react";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { Heart } from "lucide-react";

export function QuickWishlistButton({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const iconRef = useRef<SVGSVGElement>(null);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        iconRef.current?.classList.remove("heart-pop");
        iconRef.current?.getBoundingClientRect();
        iconRef.current?.classList.add("heart-pop");
        // Optimistic update
        setWishlisted((prev) => !prev);
        startTransition(async () => {
          const result = await toggleWishlist(productId);
          if (result.added !== undefined) {
            setWishlisted(result.added);
          }
        });
      }}
      disabled={pending}
      className={`flex size-9 items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-110 ${
        wishlisted
          ? "bg-destructive text-white"
          : "bg-white text-warm-dark hover:bg-white/90"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        ref={iconRef}
        className={`size-4 transition-colors duration-200 ${
          wishlisted ? "fill-current" : ""
        }`}
      />
    </button>
  );
}
