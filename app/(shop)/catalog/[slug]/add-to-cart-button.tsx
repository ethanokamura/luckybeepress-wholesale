"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuantityInput } from "@/components/shop/quantity-input";
import { addToCart } from "@/lib/actions/cart";
import { AlertCircle, CheckCircle } from "lucide-react";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AddToCartButton({
  productId,
  hasBoxOption,
  singlesIncrement,
  boxIncrement,
  singlesPrice,
  boxPrice,
}: {
  productId: string;
  hasBoxOption: boolean;
  singlesIncrement: number;
  boxIncrement: number;
  singlesPrice: number;
  boxPrice?: number;
}) {
  const [type, setType] = useState<"single" | "box_set">("single");
  const [quantity, setQuantity] = useState(singlesIncrement);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const increment = type === "single" ? singlesIncrement : boxIncrement;
  const unitPrice = type === "single" ? singlesPrice : (boxPrice ?? 0);
  const subtotal = quantity * unitPrice;

  function handleTypeChange(newType: "single" | "box_set") {
    setType(newType);
    setQuantity(newType === "single" ? singlesIncrement : boxIncrement);
    setMessage(null);
  }

  function handleAddToCart() {
    if (quantity % increment !== 0) {
      setMessage({ type: "error", text: `Quantity must be a multiple of ${increment}` });
      return;
    }
    startTransition(async () => {
      const result = await addToCart(productId, type, quantity);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Added to cart" });
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 800);
      }
    });
  }

  return (
    <div className={`flex flex-col gap-3 rounded-lg ${showFlash ? "success-flash" : ""}`}>
      {hasBoxOption && (
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange("single")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              type === "single" ? "border-primary bg-primary/10" : "hover:bg-muted"
            }`}
          >
            Singles
          </button>
          <button
            onClick={() => handleTypeChange("box_set")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              type === "box_set" ? "border-primary bg-primary/10" : "hover:bg-muted"
            }`}
          >
            Box Sets
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <QuantityInput
          value={quantity}
          increment={increment}
          onChange={setQuantity}
          disabled={pending}
          min={increment}
        />

        <Button onClick={handleAddToCart} disabled={pending} className="flex-1">
          {pending ? "Adding..." : "Add to Cart"}
        </Button>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground">
          {type === "single"
            ? `Sold in sets of ${singlesIncrement}`
            : `Sold in sets of ${boxIncrement} boxes`}
        </p>
        <p className="text-sm font-medium text-muted-foreground font-mono">
          Subtotal: {formatCents(subtotal)}
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? (
            <AlertCircle className="size-4" />
          ) : (
            <CheckCircle className="size-4 text-success" />
          )}
          <AlertDescription className={message.type === "success" ? "text-success" : undefined}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
