"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Category = { id: string; name: string; slug: string };

export function CatalogFiltersBar({
  categories,
  currentFilters,
}: {
  categories: Category[];
  currentFilters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/catalog?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced search — fires 300ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const current = searchParams.get("search") ?? "";
      if (searchValue !== current) {
        updateFilter("search", searchValue || null);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, searchParams, updateFilter]);

  const hasActiveFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="border-b pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search — live debounced */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, SKU, or keyword..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category */}
        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v === "all" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select
          value={currentFilters.type ?? "all"}
          onValueChange={(v) => updateFilter("type", v === "all" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="singles">Singles Only</SelectItem>
            <SelectItem value="box_sets">Box Sets Available</SelectItem>
          </SelectContent>
        </Select>

        {/* Badge */}
        <Select
          value={currentFilters.badge ?? "all"}
          onValueChange={(v) => updateFilter("badge", v === "all" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="best_seller">Best Sellers</SelectItem>
            <SelectItem value="new_arrival">New Arrivals</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>

        {/* Available toggle */}
        <Select
          value={currentFilters.available ?? "available"}
          onValueChange={(v) => updateFilter("available", v === "available" ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Available Only" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available Only</SelectItem>
            <SelectItem value="all">Show All</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear */}
        {hasActiveFilters && (
          <Badge
            variant="destructive"
            className="cursor-pointer gap-1 transition-colors hover:bg-destructive/90"
            onClick={() => {
              setSearchValue("");
              router.push("/catalog");
            }}
          >
            Clear filters
            <X className="size-3" />
          </Badge>
        )}
      </div>
    </div>
  );
}
