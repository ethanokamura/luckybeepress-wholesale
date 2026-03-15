import { getApprovedCustomersForDropdown, getAdminProducts } from "@/lib/admin/queries";
import { ManualOrderForm } from "./manual-order-form";

export default async function CreateOrderPage() {
  const [customers, products] = await Promise.all([
    getApprovedCustomersForDropdown(),
    getAdminProducts(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Create Manual Order</h1>
      <ManualOrderForm
        customers={customers.map((c) => ({
          id: c.id,
          businessName: c.businessName ?? "Unknown",
          customDiscountPercent: c.customDiscountPercent,
          isNet30Eligible: c.isNet30Eligible,
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          wholesalePrice: p.wholesalePrice,
          hasBoxOption: p.hasBoxOption,
          boxWholesalePrice: p.boxWholesalePrice,
          categoryName: p.categoryName,
          isAvailable: p.isAvailable,
        }))}
      />
    </div>
  );
}
