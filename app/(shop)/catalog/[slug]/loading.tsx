import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="size-3.5" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-3.5" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          <div>
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="mt-3 h-6 w-20 rounded-full" />
          </div>

          {/* Pricing card */}
          <div className="rounded-xl ring-1 ring-foreground/10 p-4 flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>

          {/* Specs */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-2/3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
