import { notFound } from "next/navigation";
import { getProductDetail, getCategories } from "@/lib/admin/queries";
import { EditProductForm } from "./edit-product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductDetail(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Edit Product: {product.name}</h1>
      <EditProductForm
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          hasBoxOption: product.hasBoxOption,
          boxWholesalePrice: product.boxWholesalePrice,
          boxRetailPrice: product.boxRetailPrice,
          description: product.description,
          images: product.images as string[] | null,
          seasonalTag: product.seasonalTag,
          orderByDate: product.orderByDate,
          isAvailable: product.isAvailable,
          isBestSeller: product.isBestSeller,
          isNewArrival: product.isNewArrival,
          isFeatured: product.isFeatured,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name, supportsBoxSet: c.supportsBoxSet }))}
      />
    </div>
  );
}
