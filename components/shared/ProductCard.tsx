"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/firebase-helpers";
import type { Product, ProductListItem } from "@/types";

interface ProductCardProps {
  product: Product | ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.inventory <= 0;
  const hasBoxOption = product.hasBoxOption && product.boxWholesalePrice;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-lg p-4 overflow-hidden transition-all hover:shadow-lg border border-transparent hover:border-primary"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105 rounded-md"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">
            <Image
              src="/logo.svg"
              alt="Lucky Bee Press"
              fill
              className="object-cover transition-transform group-hover:scale-105 rounded-md"
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
          {hasBoxOption && (
            <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              Box Available
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-muted-foreground text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-2.5 sm:pt-4">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1">
          {product.category}
        </p>
        <h3 className="font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Pricing */}
        {/* <div className="mt-1.5 sm:mt-2">
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className="text-base sm:text-lg font-bold text-foreground">
              {formatPrice(product.wholesalePrice)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              /card
            </span>
          </div>
          {hasBoxOption && (
            <p className="text-xs sm:text-sm text-primary">
              or {formatPrice(product.boxWholesalePrice!)}/box
            </p>
          )}
        </div> */}
      </div>
    </Link>
  );
}
