import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <div className="relative flex min-h-[92vh] items-center justify-center">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>

      {/* Trust bar skeleton */}
      <div className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-12 px-4 py-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24 hidden sm:block" />
          ))}
          <Skeleton className="h-4 w-32 sm:hidden" />
        </div>
      </div>
    </div>
  );
}
