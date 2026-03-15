import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic shop loading state.
 * Used for orders, wishlist, account, and other list-based shop pages.
 * The catalog page has its own loading.tsx that matches the product grid.
 */
export default function ShopLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page title */}
      <div>
        <Skeleton className="h-9 w-36" />
        <Skeleton className="mt-3 h-4 w-24" />
      </div>

      {/* List rows — matches orders/wishlist layout */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border bg-card p-4"
          >
            <Skeleton className="size-16 shrink-0 rounded-md" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
