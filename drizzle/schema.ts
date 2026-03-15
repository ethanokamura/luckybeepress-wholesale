import { pgTable, foreignKey, uuid, text, boolean, timestamp, integer, unique, jsonb, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accountStatus = pgEnum("account_status", ['pending', 'active', 'rejected', 'suspended'])
export const lineItemType = pgEnum("line_item_type", ['single', 'box_set'])
export const orderStatus = pgEnum("order_status", ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
export const paymentMethod = pgEnum("payment_method", ['credit_card', 'net_30'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'voided'])


export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	label: text(),
	recipientName: text("recipient_name").notNull(),
	street1: text().notNull(),
	street2: text(),
	city: text().notNull(),
	state: text().notNull(),
	zip: text().notNull(),
	country: text().default('US').notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	lineItemType: lineItemType("line_item_type").default('single').notNull(),
	quantity: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_items_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	sku: text(),
	categoryId: uuid("category_id").notNull(),
	description: text(),
	shortDescription: text("short_description"),
	tags: jsonb().default([]).notNull(),
	wholesalePrice: integer("wholesale_price").notNull(),
	retailPrice: integer("retail_price").notNull(),
	hasBoxOption: boolean("has_box_option").default(false).notNull(),
	boxWholesalePrice: integer("box_wholesale_price"),
	boxRetailPrice: integer("box_retail_price"),
	minimumOrderQuantity: integer("minimum_order_quantity").default(6).notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	isBestSeller: boolean("is_best_seller").default(false).notNull(),
	isNewArrival: boolean("is_new_arrival").default(false).notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	featuredOrder: integer("featured_order"),
	seasonalTag: text("seasonal_tag"),
	orderByDate: timestamp("order_by_date", { withTimezone: true, mode: 'string' }),
	sortOrder: integer("sort_order").default(0).notNull(),
	images: jsonb().default([]).notNull(),
	weightOz: numeric("weight_oz", { precision: 6, scale:  2 }),
	salesCount: integer("sales_count").default(0).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	legacyId: text("legacy_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	supportsBoxSet: boolean("supports_box_set").default(false).notNull(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
	unique("categories_slug_unique").on(table.slug),
]);

export const platformSettings = pgTable("platform_settings", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	description: text(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderNumber: text("order_number").notNull(),
	userId: uuid("user_id").notNull(),
	status: orderStatus().default('pending').notNull(),
	paymentMethod: paymentMethod("payment_method").notNull(),
	paymentStatus: paymentStatus("payment_status").default('pending').notNull(),
	subtotal: integer().notNull(),
	shippingCost: integer("shipping_cost").notNull(),
	taxAmount: integer("tax_amount").default(0).notNull(),
	discountPercent: numeric("discount_percent", { precision: 5, scale:  2 }).default('0').notNull(),
	discountAmount: integer("discount_amount").default(0).notNull(),
	total: integer().notNull(),
	notes: text(),
	trackingNumber: text("tracking_number"),
	shippingAddressSnapshot: jsonb("shipping_address_snapshot").notNull(),
	stripePaymentIntentId: text("stripe_payment_intent_id"),
	stripeInvoiceId: text("stripe_invoice_id"),
	isAdminCreated: boolean("is_admin_created").default(false).notNull(),
	adminOverrideReason: text("admin_override_reason"),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancelReason: text("cancel_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const wishlistItems = pgTable("wishlist_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlist_items_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlist_items_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const refunds = pgTable("refunds", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	amount: integer().notNull(),
	reason: text().notNull(),
	stripeRefundId: text("stripe_refund_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "refunds_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text("session_token").primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { withTimezone: true, mode: 'string' }),
	image: text(),
	passwordHash: text("password_hash"),
	businessName: text("business_name"),
	ownerName: text("owner_name"),
	phone: text(),
	businessType: text("business_type"),
	ein: text(),
	resaleCertificateUrl: text("resale_certificate_url"),
	status: accountStatus().default('pending').notNull(),
	isTaxExempt: boolean("is_tax_exempt").default(false).notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	isNet30Eligible: boolean("is_net30_eligible").default(false).notNull(),
	customDiscountPercent: numeric("custom_discount_percent", { precision: 5, scale:  2 }).default('0'),
	internalNotes: text("internal_notes"),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	productName: text("product_name").notNull(),
	lineItemType: lineItemType("line_item_type").notNull(),
	quantity: integer().notNull(),
	unitPrice: integer("unit_price").notNull(),
	lineTotal: integer("line_total").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_provider_account_id_pk"}),
]);
