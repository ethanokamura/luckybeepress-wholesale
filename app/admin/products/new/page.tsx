import { getCategories } from "@/lib/admin/queries";
import { ProductForm } from "./product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">New Product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, supportsBoxSet: c.supportsBoxSet }))}
      />
    </div>
  );
}
