"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/lib/admin/actions";

type Category = {
  id: string;
  name: string;
  supportsBoxSet: boolean;
};

type ProductData = {
  id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  wholesalePrice: number;
  retailPrice: number;
  hasBoxOption: boolean;
  boxWholesalePrice: number | null;
  boxRetailPrice: number | null;
  description: string | null;
  images: string[] | null;
  seasonalTag: string | null;
  orderByDate: Date | null;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
};

export function EditProductForm({
  product,
  categories,
}: {
  product: ProductData;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(product.categoryId ?? "");
  const [hasBoxOption, setHasBoxOption] = useState(product.hasBoxOption);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const canHaveBoxSet = selectedCategory?.supportsBoxSet ?? false;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert dollar inputs to cents
    const wsp = parseFloat(formData.get("wholesalePrice") as string);
    const srp = parseFloat(formData.get("retailPrice") as string);
    if (isNaN(wsp) || isNaN(srp)) {
      setError("Please enter valid prices.");
      return;
    }
    formData.set("wholesalePrice", String(Math.round(wsp * 100)));
    formData.set("retailPrice", String(Math.round(srp * 100)));

    if (hasBoxOption) {
      const boxWsp = parseFloat(formData.get("boxWholesalePrice") as string);
      const boxSrp = parseFloat(formData.get("boxRetailPrice") as string);
      if (!isNaN(boxWsp)) formData.set("boxWholesalePrice", String(Math.round(boxWsp * 100)));
      if (!isNaN(boxSrp)) formData.set("boxRetailPrice", String(Math.round(boxSrp * 100)));
    }

    formData.set("hasBoxOption", hasBoxOption ? "true" : "false");

    // Collect image URLs
    const images: string[] = [];
    for (let i = 0; i < 4; i++) {
      const url = formData.get(`image_${i}`) as string;
      if (url?.trim()) images.push(url.trim());
      formData.delete(`image_${i}`);
    }
    formData.set("images", JSON.stringify(images));

    startTransition(async () => {
      const result = await updateProduct(product.id, formData);
      if (result.success) {
        router.push("/admin/products");
      } else {
        setError(result.error ?? "Failed to update product.");
      }
    });
  };

  const imageSlots = [0, 1, 2, 3].map(
    (i) => product.images?.[i] ?? "",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            name="sku"
            defaultValue={product.sku ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          name="categoryId"
          required
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            const cat = categories.find((c) => c.id === e.target.value);
            if (!cat?.supportsBoxSet) setHasBoxOption(false);
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Wholesale Price ($)
          </label>
          <input
            name="wholesalePrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={(product.wholesalePrice / 100).toFixed(2)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Retail Price ($)
          </label>
          <input
            name="retailPrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={(product.retailPrice / 100).toFixed(2)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Box Option — only shown when category supports box sets */}
      {canHaveBoxSet && (
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasBoxOption}
            onChange={(e) => setHasBoxOption(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Available as Box Set (6 cards per box)</span>
        </label>
        {hasBoxOption && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Box Wholesale Price ($)
              </label>
              <input
                name="boxWholesalePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  product.boxWholesalePrice
                    ? (product.boxWholesalePrice / 100).toFixed(2)
                    : ""
                }
                placeholder="11.00"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Box Retail Price ($)
              </label>
              <input
                name="boxRetailPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  product.boxRetailPrice
                    ? (product.boxRetailPrice / 100).toFixed(2)
                    : ""
                }
                placeholder="0.00"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={product.description ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Image URLs (up to 4)
        </label>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              name={`image_${i}`}
              type="url"
              defaultValue={imageSlots[i]}
              placeholder={`Image URL ${i + 1}`}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Seasonal Tag</label>
          <input
            name="seasonalTag"
            defaultValue={product.seasonalTag ?? ""}
            placeholder="e.g., spring, holiday"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Order By Date</label>
          <input
            name="orderByDate"
            type="date"
            defaultValue={
              product.orderByDate
                ? new Date(product.orderByDate).toISOString().split("T")[0]
                : ""
            }
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isAvailable"
            defaultChecked={product.isAvailable}
            className="rounded"
          />
          <span className="text-sm">Available</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isBestSeller"
            defaultChecked={product.isBestSeller}
            className="rounded"
          />
          <span className="text-sm">Best Seller</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isNewArrival"
            defaultChecked={product.isNewArrival}
            className="rounded"
          />
          <span className="text-sm">New Arrival</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product.isFeatured}
            className="rounded"
          />
          <span className="text-sm">Featured</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
