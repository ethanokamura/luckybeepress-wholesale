import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";

export type ProductStatus = "draft" | "active" | "archived";

export interface Product extends FirebaseDoc {
  // Core fields
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  images: string[]; // Storage URLs
  category: string;
  tags: string[];
  status: ProductStatus;
  featured: boolean;

  // Wholesale pricing (all in cents)
  wholesalePrice: number; // $3.00 = 300 (per card)
  retailPrice: number; // Suggested retail price (SRP)
  costPerItem: number | null; // Cost to produce

  // Box set option (only for Thank You and Holiday cards)
  hasBoxOption: boolean; // Whether this card is available as a box set
  boxWholesalePrice: number | null; // $11.00 = 1100 (per box of 6)
  boxRetailPrice: number | null; // Box SRP

  // Inventory
  sku: string;
  inventory: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  // Ordering
  minimumOrderQuantity: number; // Usually 6 for singles

  // Physical properties
  weightOz: number | null; // For shipping calculations

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;

  // Stats
  salesCount: number;
  viewCount: number;

  // Legacy reference (for migration tracking)
  legacyId: string | null;
}

export type CreateProduct = CreateDoc<Product>;
export type UpdateProduct = UpdateDoc<Product>;

/** Lightweight product for listings */
export type ProductListItem = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "wholesalePrice"
  | "retailPrice"
  | "hasBoxOption"
  | "boxWholesalePrice"
  | "images"
  | "category"
  | "inventory"
  | "status"
>;

/** Categories that support box sets */
export const BOX_SET_CATEGORIES = [
  "Thank You",
  "Holiday",
  "Christmas",
  "Hanukkah",
  "Season's Greetings",
] as const;

/** Default wholesale prices (in cents) */
export const WHOLESALE_PRICING = {
  SINGLE_PRICE: 300, // $3.00 per card
  SINGLE_MIN_QTY: 6, // Minimum 6 cards per order
  BOX_PRICE: 1100, // $11.00 per box
  BOX_MIN_QTY: 4, // Minimum 4 boxes per order
  CARDS_PER_BOX: 6, // 6 cards per box
} as const;
