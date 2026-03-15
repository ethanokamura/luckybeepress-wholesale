/**
 * Generate vector embeddings for all products.
 * Uses OpenAI text-embedding-3-small (1536 dims).
 *
 * Run: bun run db:generate-embeddings
 * Requires: OPENAI_API_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import * as schema from "./schema";
import { isNull } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

function buildSearchText(product: {
  name: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  tags: string[];
  categoryName: string | null;
  seasonalTag: string | null;
}): string {
  const parts = [
    product.name,
    product.sku ? `SKU ${product.sku}` : "",
    product.categoryName ?? "",
    product.seasonalTag ?? "",
    product.shortDescription ?? "",
    product.description ?? "",
    ...(product.tags ?? []),
  ].filter(Boolean);

  return parts.join(" | ");
}

async function generate() {
  // Get products missing embeddings
  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      description: schema.products.description,
      shortDescription: schema.products.shortDescription,
      sku: schema.products.sku,
      tags: schema.products.tags,
      seasonalTag: schema.products.seasonalTag,
      categoryId: schema.products.categoryId,
    })
    .from(schema.products);

  // Get category names
  const categories = await db
    .select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Check which products already have embeddings
  const rawSql = neon(process.env.DATABASE_URL!);
  const existing = await rawSql`SELECT id FROM products WHERE embedding IS NOT NULL` as { id: string }[];
  const existingIds = new Set(existing.map((r) => r.id));

  const toEmbed = products.filter((p) => !existingIds.has(p.id));

  if (toEmbed.length === 0) {
    console.log("All products already have embeddings.");
    return;
  }

  console.log(`Generating embeddings for ${toEmbed.length} products...`);

  // Build search text for each product
  const texts = toEmbed.map((p) =>
    buildSearchText({
      ...p,
      categoryName: catMap.get(p.categoryId) ?? null,
    })
  );

  // Batch embed (OpenAI supports up to 2048 per request)
  const BATCH_SIZE = 100;
  let processed = 0;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchProducts = toEmbed.slice(i, i + BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batch,
    });

    // Store embeddings via raw SQL (drizzle doesn't support vector type)
    for (let j = 0; j < embeddings.length; j++) {
      const embedding = embeddings[j];
      const productId = batchProducts[j].id;
      const vectorStr = `[${embedding.join(",")}]`;

      await rawSql`UPDATE products SET embedding = ${vectorStr}::vector WHERE id = ${productId}`;
    }

    processed += batch.length;
    console.log(`  ${processed}/${toEmbed.length} done`);
  }

  console.log(`\nGenerated embeddings for ${processed} products.`);
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Embedding generation failed:", err);
    process.exit(1);
  });
