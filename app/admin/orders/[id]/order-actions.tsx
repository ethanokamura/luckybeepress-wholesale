"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import {
  setTrackingNumber,
  markDelivered,
  issueRefund,
  cancelOrder,
} from "@/lib/admin/actions";

export function OrderActions({
  orderId,
  orderStatus,
  currentTrackingNumber,
}: {
  orderId: string;
  orderStatus: string;
  currentTrackingNumber: string | null;
}) {
  const [trackingNum, setTrackingNum] = useState(currentTrackingNumber ?? "");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleShip = () => {
    if (!trackingNum.trim()) return;
    startTransition(async () => {
      const result = await setTrackingNumber(orderId, trackingNum.trim());
      if (result.success) {
        showMessage("success", "Tracking number set and order marked as shipped.");
      } else {
        showMessage("error", result.error ?? "Failed to set tracking number.");
      }
    });
  };

  const handleMarkDelivered = () => {
    startTransition(async () => {
      const result = await markDelivered(orderId);
      if (result.success) {
        showMessage("success", "Order marked as delivered.");
      } else {
        showMessage("error", result.error ?? "Failed to mark as delivered.");
      }
    });
  };

  const handleRefund = () => {
    const dollars = parseFloat(refundAmount);
    if (isNaN(dollars) || dollars <= 0) {
      showMessage("error", "Enter a valid refund amount.");
      return;
    }
    const cents = Math.round(dollars * 100);
    startTransition(async () => {
      const result = await issueRefund(orderId, cents, refundReason || "Refund");
      if (result.success) {
        showMessage("success", "Refund issued successfully.");
        setRefundAmount("");
        setRefundReason("");
      } else {
        showMessage("error", result.error ?? "Failed to issue refund.");
      }
    });
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      showMessage("error", "Please provide a cancellation reason.");
      return;
    }
    if (!confirm("Are you sure you want to cancel this order?")) return;
    startTransition(async () => {
      const result = await cancelOrder(orderId, cancelReason.trim());
      if (result.success) {
        showMessage("success", "Order cancelled.");
        setCancelReason("");
      } else {
        showMessage("error", result.error ?? "Failed to cancel order.");
      }
    });
  };

  const isCancelled = orderStatus === "cancelled";
  const isDelivered = orderStatus === "delivered";

  return (
    <section className="rounded-md border p-6 space-y-6">
      <h2 className="text-lg font-semibold">Actions</h2>

      {/* Invoice Download */}
      <a
        href={`/api/orders/${orderId}/invoice`}
        download
        className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <FileText className="size-4" />
        Download Invoice PDF
      </a>

      {message && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Shipping */}
      {!isCancelled && !isDelivered && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tracking Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNum}
              onChange={(e) => setTrackingNum(e.target.value)}
              placeholder="Enter tracking number"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button
              onClick={handleShip}
              disabled={isPending || !trackingNum.trim()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Ship
            </button>
          </div>
        </div>
      )}

      {/* Mark Delivered */}
      {orderStatus === "shipped" && (
        <button
          onClick={handleMarkDelivered}
          disabled={isPending}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Mark Delivered"}
        </button>
      )}

      {/* Refund */}
      {!isCancelled && (
        <div className="space-y-2 border-t pt-4">
          <label className="block text-sm font-medium">Issue Refund</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="Amount in dollars"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={handleRefund}
            disabled={isPending || !refundAmount}
            className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Issue Refund"}
          </button>
        </div>
      )}

      {/* Cancel */}
      {!isCancelled && !isDelivered && (
        <div className="space-y-2 border-t pt-4">
          <label className="block text-sm font-medium">Cancel Order</label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Cancellation reason"
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={handleCancel}
            disabled={isPending || !cancelReason.trim()}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Cancel Order"}
          </button>
        </div>
      )}
    </section>
  );
}
