"use client";

import { useTransition } from "react";
import { cancelOrderAction, reorderAction } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function OrderActions({
  orderId,
  canCancel,
}: {
  orderId: string;
  canCancel: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" asChild>
        <a href={`/api/orders/${orderId}/invoice`} download>
          <Download data-icon="inline-start" />
          Invoice PDF
        </a>
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await reorderAction(orderId); })}
      >
        Reorder
      </Button>
      {canCancel && (
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (confirm("Are you sure you want to cancel this order?")) {
              startTransition(async () => { await cancelOrderAction(orderId); });
            }
          }}
        >
          Cancel Order
        </Button>
      )}
    </div>
  );
}
