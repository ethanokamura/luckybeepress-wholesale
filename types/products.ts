import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductVariant {
  id: string;
  name: string; // "Small", "Red", etc.
  sku: string;
  price: number; // in cents
  compareAtPrice: number | null; // for showing discounts
  inventory: number;
  weight: number | null; // in grams
}

export interface Product extends FirebaseDoc {
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  images: string[]; // Storage URLs
  category: string;
  tags: string[];
  status: ProductStatus;
  featured: boolean;

  // Pricing (in cents to avoid floating point issues)
  price: number;
  compareAtPrice: number | null;
  costPerItem: number | null; // for profit tracking

  // Inventory
  sku: string | null;
  barcode: string | null;
  inventory: number;
  trackInventory: boolean;
  allowBackorder: boolean;

  // Variants (optional)
  hasVariants: boolean;
  variants: ProductVariant[];

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;

  // Stats
  salesCount: number;
  viewCount: number;
}

export type CreateProduct = CreateDoc<Product>;
export type UpdateProduct = UpdateDoc<Product>;

/** Lightweight product for listings */
export type ProductListItem = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "price"
  | "compareAtPrice"
  | "images"
  | "category"
  | "inventory"
  | "status"
>;
