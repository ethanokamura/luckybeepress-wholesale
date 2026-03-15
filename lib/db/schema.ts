import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  uuid,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Enums ───────────────────────────────────────────────────

export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "active",
  "rejected",
  "suspended",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "net_30",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
  "voided",
]);

/** Used on cart_items and order_items to distinguish singles vs box orders */
export const lineItemTypeEnum = pgEnum("line_item_type", [
  "single",
  "box_set",
]);

// ─── Auth.js Tables ──────────────────────────────────────────
// These follow the Auth.js Drizzle adapter schema.
// The `users` table doubles as our customer record.

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),

  // ── Business / wholesale fields ──
  businessName: text("business_name"),
  ownerName: text("owner_name"),
  phone: text("phone"),
  businessType: text("business_type"),
  ein: text("ein"),
  resaleCertificateUrl: text("resale_certificate_url"),
  status: accountStatusEnum("status").default("pending").notNull(),
  isTaxExempt: boolean("is_tax_exempt").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isNet30Eligible: boolean("is_net30_eligible").default(false).notNull(),
  customDiscountPercent: numeric("custom_discount_percent", {
    precision: 5,
    scale: 2,
  }).default("0"),
  internalNotes: text("internal_notes"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Password Reset Tokens ──────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Addresses ───────────────────────────────────────────────

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  recipientName: text("recipient_name").notNull(),
  street1: text("street1").notNull(),
  street2: text("street2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  country: text("country").default("US").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Categories ──────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  supportsBoxSet: boolean("supports_box_set").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Products ────────────────────────────────────────────────
// Modeled after the Faire/legacy product structure:
// - A product is a card design (always sold as singles in increments of 6)
// - Some products also have a box set option (increments of 4 boxes of 6 cards)
// - Prices stored in cents to avoid floating-point issues

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku"),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  description: text("description"),
  shortDescription: text("short_description"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),

  // ── Pricing (in cents) ──
  wholesalePrice: integer("wholesale_price").notNull(), // per card, e.g. 300 = $3.00
  retailPrice: integer("retail_price").notNull(), // suggested retail (SRP)

  // ── Box set option ──
  hasBoxOption: boolean("has_box_option").default(false).notNull(),
  boxWholesalePrice: integer("box_wholesale_price"), // per box of 6, e.g. 1100 = $11.00
  boxRetailPrice: integer("box_retail_price"), // box SRP

  // ── Ordering ──
  minimumOrderQuantity: integer("minimum_order_quantity").default(6).notNull(), // singles increment

  // ── Status & badges ──
  isAvailable: boolean("is_available").default(true).notNull(),
  isBestSeller: boolean("is_best_seller").default(false).notNull(),
  isNewArrival: boolean("is_new_arrival").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  featuredOrder: integer("featured_order"),
  seasonalTag: text("seasonal_tag"),
  orderByDate: timestamp("order_by_date", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0).notNull(),

  // ── Media ──
  images: jsonb("images").$type<string[]>().default([]).notNull(), // array of URLs, first is primary

  // ── Physical ──
  weightOz: numeric("weight_oz", { precision: 6, scale: 2 }),

  // ── Stats ──
  salesCount: integer("sales_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),

  // ── Migration ──
  legacyId: text("legacy_id"),

  // ── Search (pgvector) ──
  // 1536-dim embedding from OpenAI text-embedding-3-small
  // Column managed via raw SQL (drizzle-orm doesn't have native vector type)
  // Query via lib/queries/catalog.ts semantic search

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Wishlist Items ──────────────────────────────────────────

export const wishlistItems = pgTable("wishlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Cart Items ──────────────────────────────────────────────
// lineItemType distinguishes whether the customer is ordering
// singles (increment of 6) or box sets (increment of 4) of a product.

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  lineItemType: lineItemTypeEnum("line_item_type")
    .default("single")
    .notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Orders ──────────────────────────────────────────────────
// Monetary amounts stored in cents.

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status")
    .default("pending")
    .notNull(),
  subtotal: integer("subtotal").notNull(), // cents
  shippingCost: integer("shipping_cost").notNull(), // cents
  taxAmount: integer("tax_amount").default(0).notNull(), // cents
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
    .default("0")
    .notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(), // cents
  total: integer("total").notNull(), // cents
  notes: text("notes"),
  trackingNumber: text("tracking_number"),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot")
    .$type<{
      recipientName: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }>()
    .notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  isAdminCreated: boolean("is_admin_created").default(false).notNull(),
  adminOverrideReason: text("admin_override_reason"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Order Items ─────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  lineItemType: lineItemTypeEnum("line_item_type").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // cents
  lineTotal: integer("line_total").notNull(), // cents
});

// ─── Refunds ─────────────────────────────────────────────────

export const refunds = pgTable("refunds", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // cents
  reason: text("reason").notNull(),
  stripeRefundId: text("stripe_refund_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Platform Settings ──────────────────────────────────────

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Wholesale Constants ─────────────────────────────────────
// Mirrors the legacy WHOLESALE_PRICING constants for easy reference.

export const WHOLESALE_PRICING = {
  SINGLE_PRICE: 300, // $3.00 per card
  SINGLE_MIN_QTY: 6, // minimum 6 cards per increment
  BOX_PRICE: 1100, // $11.00 per box
  BOX_MIN_QTY: 4, // minimum 4 boxes per increment
  CARDS_PER_BOX: 6, // 6 cards per box
} as const;

export const BOX_SET_CATEGORIES = [
  "Thank You",
  "Holiday",
  "Christmas",
  "Hanukkah",
  "Season's Greetings",
] as const;

// ─── Relations ───────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  addresses: many(addresses),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  orders: many(orders),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  refunds: many(refunds),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, { fields: [refunds.orderId], references: [orders.id] }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
