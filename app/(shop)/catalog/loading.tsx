import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header — matches h1 + subtitle */}
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>

      {/* Filter bar — matches 5 controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-[140px] rounded-lg" />
        <Skeleton className="h-9 w-[120px] rounded-lg" />
        <Skeleton className="h-9 w-[130px] rounded-lg" />
        <Skeleton className="h-9 w-[130px] rounded-lg" />
      </div>

      {/* Product grid — matches full-bleed card layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
