"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createManualOrder } from "@/lib/admin/actions";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type Customer = {
  id: string;
  businessName: string;
  customDiscountPercent: string | null;
  isNet30Eligible: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  wholesalePrice: number;
  hasBoxOption: boolean;
  boxWholesalePrice: number | null;
  categoryName: string | null;
  isAvailable: boolean;
  image: string | null;
};

type DraftItem = {
  productId: string;
  name: string;
  lineItemType: "single" | "box_set";
  unitPrice: number;
  quantity: number;
  image: string | null;
};

export function ManualOrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState("");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const discountPercent = parseFloat(selectedCustomer?.customDiscountPercent ?? "0");

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.isAvailable &&
          (p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.categoryName?.toLowerCase().includes(q)),
      )
      .slice(0, 10);
  }, [productSearch, products]);

  const addProduct = (product: Product, asBoxSet: boolean = false) => {
    const lineItemType = asBoxSet ? "box_set" as const : "single" as const;
    const unitPrice = asBoxSet
      ? (product.boxWholesalePrice ?? product.wholesalePrice)
      : product.wholesalePrice;
    const itemKey = `${product.id}-${lineItemType}`;

    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.id && i.lineItemType === lineItemType,
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.lineItemType === lineItemType
            ? { ...i, quantity: i.quantity + (asBoxSet ? 4 : 6) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: asBoxSet ? `${product.name} (Box of 6)` : product.name,
          lineItemType,
          unitPrice,
          quantity: asBoxSet ? 4 : 6,
          image: product.image,
        },
      ];
    });
    setProductSearch("");
  };

  const updateQuantity = (productId: string, lineItemType: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.lineItemType === lineItemType)));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId && i.lineItemType === lineItemType ? { ...i, quantity } : i)),
      );
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const shippingCost = 1500;
  const total = subtotal - discountAmount + shippingCost;

  const handleSubmit = () => {
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one product.");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createManualOrder({
        userId: selectedCustomerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          lineItemType: i.lineItemType,
        })),
        paymentMethod,
        notes: notes || undefined,
        overrideReason: overrideReason.trim() || undefined,
      });
      if (result.success) {
        router.push("/admin/orders");
      } else {
        setError(result.error ?? "Failed to create order.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Customer</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => {
            setSelectedCustomerId(e.target.value);
            setPaymentMethod("credit_card");
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select a customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.businessName}
              {c.isNet30Eligible ? " (Net 30 eligible)" : ""}
            </option>
          ))}
        </select>
        {selectedCustomer && discountPercent > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Customer discount: {discountPercent}%
          </p>
        )}
      </div>

      {/* Product Search */}
      <div>
        <label className="block text-sm font-medium mb-1">Add Products</label>
        <div className="relative">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm border-b last:border-b-0"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={40}
                      height={40}
                      className="rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-10 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    {p.sku && (
                      <span className="text-xs text-muted-foreground">{p.sku}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => addProduct(p, false)}
                      className="rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary-text hover:bg-primary/20"
                    >
                      Singles {formatCents(p.wholesalePrice)}/ea
                    </button>
                    {p.hasBoxOption && p.boxWholesalePrice && (
                      <button
                        onClick={() => addProduct(p, true)}
                        className="rounded px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        Box Set {formatCents(p.boxWholesalePrice)}/box
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft Items */}
      {items.length > 0 && (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium w-12"></th>
                <th className="px-4 py-2 text-left font-medium">Product</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-center font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.productId}-${item.lineItemType}`} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.name}
                    <span className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      item.lineItemType === "box_set"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {item.lineItemType === "box_set" ? "Box Set" : "Singles"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {formatCents(item.unitPrice)}
                    <span className="text-xs text-muted-foreground ml-1">
                      /{item.lineItemType === "box_set" ? "box" : "card"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min={item.lineItemType === "box_set" ? 4 : 6}
                      step={item.lineItemType === "box_set" ? 4 : 6}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.productId, item.lineItemType, parseInt(e.target.value, 10) || 0)
                      }
                      className="w-20 rounded-md border px-2 py-1 text-center text-sm"
                    />
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {item.lineItemType === "box_set"
                        ? `${item.quantity} boxes (${item.quantity * 6} cards)`
                        : `${item.quantity} cards`}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {formatCents(item.unitPrice * item.quantity)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => updateQuantity(item.productId, item.lineItemType, 0)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="rounded-md border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono">{formatCents(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount ({discountPercent}%)</span>
            <span className="font-mono text-red-600">-{formatCents(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping (flat)</span>
          <span className="font-mono">{formatCents(shippingCost)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span className="font-mono">{formatCents(total)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium mb-1">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="credit_card">Credit Card</option>
          {selectedCustomer?.isNet30Eligible && (
            <option value="net_30">Net 30</option>
          )}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Override Reason */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Override Reason (optional)
        </label>
        <input
          type="text"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
          placeholder="e.g. sample order, trade show, etc."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Creating Order..." : "Create Order"}
      </button>
    </div>
  );
}
