"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { docs, toCents, toDollars, generateSlug } from "@/lib/firebase-helpers";
import { Button } from "@/components/ui/button";
import { BOX_SET_CATEGORIES, WHOLESALE_PRICING } from "@/types/products";
import type { Product, ProductStatus } from "@/types";
import Image from "next/image";

const categories = [
  "Birthday",
  "Thank You",
  "Holiday",
  "Christmas",
  "Hanukkah",
  "Season's Greetings",
  "New Year's",
  "Valentine's Day",
  "Love",
  "Sympathy",
  "Congratulations",
  "Baby",
  "Wedding",
  "Graduation",
  "Mother's Day",
  "Father's Day",
  "Rosh Hashanah",
  "Easter",
  "Everyday",
  "Blank",
  "Other",
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "Birthday",
    sku: "",
    wholesalePrice: "",
    retailPrice: "",
    costPerItem: "",
    hasBoxOption: false,
    boxWholesalePrice: "",
    boxRetailPrice: "",
    inventory: "0",
    lowStockThreshold: "50",
    minimumOrderQuantity: "6",
    weightOz: "",
    status: "draft" as ProductStatus,
    featured: false,
    tags: "",
    images: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(docs.product(productId));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProduct(data);
          setFormData({
            name: data.name,
            description: data.description,
            shortDescription: data.shortDescription || "",
            category: data.category,
            sku: data.sku,
            wholesalePrice: toDollars(data.wholesalePrice).toString(),
            retailPrice: data.retailPrice
              ? toDollars(data.retailPrice).toString()
              : "",
            costPerItem: data.costPerItem
              ? toDollars(data.costPerItem).toString()
              : "",
            hasBoxOption: data.hasBoxOption,
            boxWholesalePrice: data.boxWholesalePrice
              ? toDollars(data.boxWholesalePrice).toString()
              : "11.00",
            boxRetailPrice: data.boxRetailPrice
              ? toDollars(data.boxRetailPrice).toString()
              : "22.00",
            inventory: data.inventory.toString(),
            lowStockThreshold: data.lowStockThreshold.toString(),
            minimumOrderQuantity: data.minimumOrderQuantity.toString(),
            weightOz: data.weightOz?.toString() || "",
            status: data.status,
            featured: data.featured,
            tags: data.tags?.join(", ") || "",
            images: data.images?.join(", ") || "",
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const canHaveBoxSet = (BOX_SET_CATEGORIES as readonly string[]).includes(
    formData.category
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const slug = generateSlug(formData.name);
      const hasBoxOption = formData.hasBoxOption && canHaveBoxSet;

      await updateDoc(docs.product(productId), {
        name: formData.name,
        slug,
        description: formData.description,
        shortDescription: formData.shortDescription || null,
        images: formData.images
          ? formData.images.split(",").map((url) => url.trim())
          : [],
        category: formData.category,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        status: formData.status,
        featured: formData.featured,

        // Pricing
        wholesalePrice: toCents(parseFloat(formData.wholesalePrice) || 3),
        retailPrice: formData.retailPrice
          ? toCents(parseFloat(formData.retailPrice))
          : null,
        costPerItem: formData.costPerItem
          ? toCents(parseFloat(formData.costPerItem))
          : null,

        // Box option
        hasBoxOption,
        boxWholesalePrice: hasBoxOption
          ? toCents(parseFloat(formData.boxWholesalePrice) || 11)
          : null,
        boxRetailPrice: hasBoxOption
          ? toCents(parseFloat(formData.boxRetailPrice) || 22)
          : null,

        // Inventory
        sku: formData.sku,
        inventory: parseInt(formData.inventory) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 50,
        minimumOrderQuantity:
          parseInt(formData.minimumOrderQuantity) ||
          WHOLESALE_PRICING.SINGLE_MIN_QTY,
        weightOz: formData.weightOz ? parseFloat(formData.weightOz) : null,

        updatedAt: Timestamp.now(),
      });

      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeleting(true);
    try {
      await deleteDoc(docs.product(productId));
      router.push("/admin/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 bg-muted animate-pulse rounded w-48 mb-8" />
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <Image
          src="/logo.svg"
          alt="Lucky Bee Press"
          width={64}
          height={64}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <Button onClick={() => router.push("/admin/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          ← Back to Products
        </button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold">Wholesale Pricing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Wholesale Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  name="wholesalePrice"
                  value={formData.wholesalePrice}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full pl-7 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Retail Price (SRP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  name="retailPrice"
                  value={formData.retailPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-7 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost Per Item
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  name="costPerItem"
                  value={formData.costPerItem}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-7 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Box Set Option */}
          {canHaveBoxSet && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="hasBoxOption"
                  id="hasBoxOption"
                  checked={formData.hasBoxOption}
                  onChange={handleChange}
                  className="rounded"
                />
                <label htmlFor="hasBoxOption" className="text-sm font-medium">
                  Available as Box Set (6 cards per box)
                </label>
              </div>

              {formData.hasBoxOption && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Box Wholesale Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        name="boxWholesalePrice"
                        value={formData.boxWholesalePrice}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full pl-7 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Box Retail Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        name="boxRetailPrice"
                        value={formData.boxRetailPrice}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full pl-7 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inventory */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold">Inventory</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Order Qty
              </label>
              <input
                type="number"
                name="minimumOrderQuantity"
                value={formData.minimumOrderQuantity}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Weight (oz)
              </label>
              <input
                type="number"
                name="weightOz"
                value={formData.weightOz}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images & Tags */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold">Images & Tags</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Image URLs (comma-separated)
            </label>
            <input
              type="text"
              name="images"
              value={formData.images}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              id="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Featured Product
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
