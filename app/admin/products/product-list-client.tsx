"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  toggleAvailability,
  toggleBestSeller,
  toggleNewArrival,
  toggleFeatured,
  batchProductAction,
} from "@/lib/admin/actions";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  wholesalePrice: number;
  wholesalePriceFormatted: string;
  retailPrice: number;
  retailPriceFormatted: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: string[] | null;
};

type Category = {
  id: string;
  name: string;
};

export function ProductListClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState("set_available");
  const [batchCategoryId, setBatchCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const handleBatchAction = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      await batchProductAction(
        Array.from(selected),
        batchAction,
        batchAction === "change_category" ? batchCategoryId : undefined,
      );
      setSelected(new Set());
    });
  };

  const handleToggle = (
    id: string,
    action: (id: string) => Promise<unknown>,
  ) => {
    startTransition(async () => {
      await action(id);
    });
  };

  return (
    <div>
      {/* Batch Action Bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select
            value={batchAction}
            onChange={(e) => setBatchAction(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="set_available">Set Available</option>
            <option value="set_unavailable">Set Unavailable</option>
            <option value="change_category">Change Category</option>
            <option value="delete">Delete</option>
          </select>
          {batchAction === "change_category" && (
            <select
              value={batchCategoryId}
              onChange={(e) => setBatchCategoryId(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleBatchAction}
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Applying..." : "Apply"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === products.length && products.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium">Image</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">WSP</th>
              <th className="px-4 py-3 text-right font-medium">SRP</th>
              <th className="px-4 py-3 text-center font-medium">Available</th>
              <th className="px-4 py-3 text-center font-medium">Badges</th>
              <th className="px-4 py-3 text-right font-medium">Sort</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        --
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-medium text-primary-text hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.categoryName ?? "Uncategorized"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {product.wholesalePriceFormatted}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {product.retailPriceFormatted}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(product.id, toggleAvailability)}
                      disabled={isPending}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                        product.isAvailable
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {product.isAvailable ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggle(product.id, toggleBestSeller)}
                        disabled={isPending}
                        className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                          product.isBestSeller
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                        title="Best Seller"
                      >
                        BS
                      </button>
                      <button
                        onClick={() => handleToggle(product.id, toggleNewArrival)}
                        disabled={isPending}
                        className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                          product.isNewArrival
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                        title="New Arrival"
                      >
                        NA
                      </button>
                      <button
                        onClick={() => handleToggle(product.id, toggleFeatured)}
                        disabled={isPending}
                        className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                          product.isFeatured
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                        title="Featured"
                      >
                        FT
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {product.sortOrder}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
