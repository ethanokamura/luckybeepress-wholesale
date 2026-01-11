"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/firebase-helpers";
import type { CartItem } from "@/types";
import { Minus, Plus } from "lucide-react";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false,
}: CartItemRowProps) {
  const minQuantity = 6; // Minimum order increment

  const handleDecrease = () => {
    if (item.quantity > minQuantity) {
      onUpdateQuantity(item.quantity - minQuantity);
    }
  };

  const handleIncrease = () => {
    onUpdateQuantity(item.quantity + minQuantity);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 rounded-md bg-muted overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            <Image
              src="/logo.svg"
              alt="Lucky Bee Press"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{item.name}</h4>
        <p className="text-sm text-muted-foreground">
          {formatPrice(item.price)} each
        </p>

        {/* Quantity controls */}
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDecrease}
            disabled={disabled || item.quantity <= minQuantity}
          >
            <Minus width={14} height={14} />
          </Button>
          <span className="w-12 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleIncrease}
            disabled={disabled}
          >
            <Plus width={14} height={14} />
          </Button>
        </div>
      </div>

      {/* Price and remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="font-bold text-foreground">
          {formatPrice(item.price * item.quantity)}
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="text-destructive hover:text-destructive"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
