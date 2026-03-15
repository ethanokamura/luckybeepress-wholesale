import { getCategories } from "@/lib/admin/queries";
import { CategoryManager } from "./category-manager";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          supportsBoxSet: c.supportsBoxSet,
          sortOrder: c.sortOrder,
          productCount: c.productCount,
        }))}
      />
    </div>
  );
}
