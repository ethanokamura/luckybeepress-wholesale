"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityInput({
  value,
  increment,
  onChange,
  disabled,
  min,
}: {
  value: number;
  increment: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  const effectiveMin = min ?? increment;

  return (
    <div className="inline-flex items-center rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => onChange(value - increment)}
        disabled={disabled || value <= effectiveMin}
        className="flex size-8 items-center justify-center text-muted-foreground transition-all duration-150 hover:bg-primary/10 hover:text-primary-text active:scale-90 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus />
      </button>
      <span className="flex w-10 items-center justify-center text-sm font-medium tabular-nums transition-all duration-150">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + increment)}
        disabled={disabled}
        className="flex size-8 items-center justify-center text-muted-foreground transition-all duration-150 hover:bg-primary/10 hover:text-primary-text active:scale-90 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus />
      </button>
    </div>
  );
}
