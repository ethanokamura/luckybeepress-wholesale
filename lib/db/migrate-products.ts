/**
 * Migrate products from Faire CSV export to Neon.
 *
 * Faire exports singles and box sets as separate rows.
 * This script merges them: singles become the base product,
 * box set rows add hasBoxOption + box pricing to the same product.
 *
 * Run: bun run lib/db/migrate-products.ts
 */

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { db } from "./index";
import { products, categories, BOX_SET_CATEGORIES } from "./schema";
import { eq } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCents(price: string): number {
  // "$3.00" → 300
  const cleaned = price.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned) * 100);
}

function parseWeight(weight: string, unit: string): number | null {
  if (!weight) return null;
  const val = parseFloat(weight);
  if (isNaN(val)) return null;
  // Normalize to oz
  if (unit === "lb") return val * 16;
  if (unit === "g") return val * 0.035274;
  if (unit === "kg") return val * 35.274;
  return val; // already oz
}

function isBoxSet(row: CsvRow): boolean {
  // Box sets: case size 4 + price $11, OR name contains "box"
  const caseSize = parseInt(row.case_quantity) || 6;
  const wholesale = parseCents(row.price_wholesale);
  const nameHasBox =
    /box|boxed/i.test(row.product_name_english);
  return caseSize === 4 || wholesale >= 1100 || nameHasBox;
}

function extractBaseName(name: string): string {
  // Strip suffixes like "- letterpress card", "- box of 6", "- Single", "- boxes set of 6"
  return name
    .replace(
      /\s*-\s*(letterpress\s*cards?|box(ed)?\s*(set\s*)?(of\s*\d+)?|single|boxes?\s*set\s*(of\s*\d+)?)\s*$/i,
      ""
    )
    .trim();
}

function extractBaseSku(sku: string): string {
  // "1370B" → "1370", "1353-B" → "1353"
  return sku.replace(/[-]?B$/i, "").trim();
}

// ─── Types ───────────────────────────────────────────────────

type CsvRow = {
  product_name_english: string;
  info_status_v2: string;
  info_product_token: string;
  info_product_type: string;
  product_description_english: string;
  case_quantity: string;
  minimum_order_quantity: string;
  item_weight: string;
  item_weight_unit: string;
  sku: string;
  price_wholesale: string;
  price_retail: string;
  product_images: string;
  continue_selling_when_out_of_stock: string;
  on_hand_inventory: string;
  order_by_date: string;
};

type MergedProduct = {
  name: string;
  description: string;
  categoryName: string;
  sku: string;
  wholesalePrice: number;
  retailPrice: number;
  hasBoxOption: boolean;
  boxWholesalePrice: number | null;
  boxRetailPrice: number | null;
  minimumOrderQuantity: number;
  isAvailable: boolean;
  images: string[];
  weightOz: number | null;
  legacyId: string;
  orderByDate: string | null;
};

// ─── Main ────────────────────────────────────────────────────

async function migrate() {
  const csvContent = readFileSync("products.csv", "utf-8");

  // Parse CSV — skip rows 1 (headers) and 2 (descriptions), use row 3 (field names) as headers
  const allRows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    from_line: 3, // skip the description row, use field-name row as headers
  });

  console.log(`Parsed ${allRows.length} CSV rows`);

  // ── Step 1: Collect unique categories ──────────────────────

  const categoryNames = new Set<string>();
  for (const row of allRows) {
    if (row.info_product_type) {
      categoryNames.add(row.info_product_type.trim());
    }
  }

  console.log(`Found ${categoryNames.size} categories: ${[...categoryNames].join(", ")}`);

  // Upsert categories
  let sortOrder = 0;
  const categoryMap = new Map<string, string>(); // name → id

  for (const name of categoryNames) {
    const slug = slugify(name);
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      categoryMap.set(name, existing.id);
      console.log(`  Category "${name}" already exists`);
    } else {
      const [created] = await db
        .insert(categories)
        .values({ name, slug, sortOrder: sortOrder++ })
        .returning({ id: categories.id });
      categoryMap.set(name, created.id);
      console.log(`  Created category "${name}"`);
    }
  }

  // ── Step 2: Merge singles + box sets into products ─────────

  // Group by base name to merge singles and box sets
  const productMap = new Map<string, MergedProduct>();

  for (const row of allRows) {
    const isBox = isBoxSet(row);
    const baseName = extractBaseName(row.product_name_english);
    const baseSku = row.sku ? extractBaseSku(row.sku) : "";
    // Use baseName + category as the merge key
    const key = `${baseName}::${row.info_product_type}`;

    const existing = productMap.get(key);

    if (isBox && existing) {
      // Merge box pricing into existing singles product
      existing.hasBoxOption = true;
      existing.boxWholesalePrice = parseCents(row.price_wholesale);
      existing.boxRetailPrice = parseCents(row.price_retail);
      // Use box images if singles had none
      if (existing.images.length === 0 && row.product_images) {
        existing.images = row.product_images.split(/\s+/).filter(Boolean);
      }
      console.log(`  Merged box set into "${baseName}"`);
    } else if (isBox && !existing) {
      // Box-only product (no matching singles row yet)
      productMap.set(key, {
        name: baseName,
        description: row.product_description_english ?? "",
        categoryName: row.info_product_type,
        sku: baseSku || row.sku || "",
        wholesalePrice: 300, // default singles price
        retailPrice: 600,
        hasBoxOption: true,
        boxWholesalePrice: parseCents(row.price_wholesale),
        boxRetailPrice: parseCents(row.price_retail),
        minimumOrderQuantity: 6,
        isAvailable: row.info_status_v2 === "Published",
        images: row.product_images
          ? row.product_images.split(/\s+/).filter(Boolean)
          : [],
        weightOz: parseWeight(row.item_weight, row.item_weight_unit),
        legacyId: row.info_product_token,
        orderByDate: row.order_by_date || null,
      });
    } else {
      // Singles product — create or update
      const merged: MergedProduct = {
        name: baseName,
        description: row.product_description_english ?? "",
        categoryName: row.info_product_type,
        sku: baseSku || row.sku || "",
        wholesalePrice: parseCents(row.price_wholesale),
        retailPrice: parseCents(row.price_retail),
        hasBoxOption: existing?.hasBoxOption ?? false,
        boxWholesalePrice: existing?.boxWholesalePrice ?? null,
        boxRetailPrice: existing?.boxRetailPrice ?? null,
        minimumOrderQuantity: parseInt(row.minimum_order_quantity) || 6,
        isAvailable: row.info_status_v2 === "Published",
        images: row.product_images
          ? row.product_images.split(/\s+/).filter(Boolean)
          : existing?.images ?? [],
        weightOz: parseWeight(row.item_weight, row.item_weight_unit),
        legacyId: row.info_product_token,
        orderByDate: row.order_by_date || null,
      };

      productMap.set(key, merged);
    }
  }

  console.log(`\nMerged into ${productMap.size} unique products`);

  // ── Step 3: Insert products ────────────────────────────────

  let inserted = 0;
  let skipped = 0;

  for (const [, product] of productMap) {
    const categoryId = categoryMap.get(product.categoryName);
    if (!categoryId) {
      console.warn(`  Skipping "${product.name}" — no category "${product.categoryName}"`);
      skipped++;
      continue;
    }

    const slug = slugify(product.name);

    // Check if already exists
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existing) {
      console.log(`  Skipping "${product.name}" — already exists`);
      skipped++;
      continue;
    }

    await db.insert(products).values({
      name: product.name,
      slug,
      sku: product.sku || null,
      categoryId,
      description: product.description,
      wholesalePrice: product.wholesalePrice,
      retailPrice: product.retailPrice,
      hasBoxOption: product.hasBoxOption,
      boxWholesalePrice: product.boxWholesalePrice,
      boxRetailPrice: product.boxRetailPrice,
      minimumOrderQuantity: product.minimumOrderQuantity,
      isAvailable: product.isAvailable,
      images: product.images,
      weightOz: product.weightOz?.toFixed(2) ?? null,
      legacyId: product.legacyId,
      orderByDate: product.orderByDate
        ? new Date(product.orderByDate)
        : null,
      tags: [],
      sortOrder: inserted,
    });

    inserted++;
  }

  console.log(`\nDone! Inserted ${inserted} products, skipped ${skipped}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
