import { relations } from "drizzle-orm/relations";
import { users, addresses, cartItems, products, categories, passwordResetTokens, orders, wishlistItems, refunds, sessions, orderItems, accounts } from "./schema";

export const addressesRelations = relations(addresses, ({one}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	addresses: many(addresses),
	cartItems: many(cartItems),
	passwordResetTokens: many(passwordResetTokens),
	orders: many(orders),
	wishlistItems: many(wishlistItems),
	sessions: many(sessions),
	accounts: many(accounts),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	user: one(users, {
		fields: [cartItems.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	cartItems: many(cartItems),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	wishlistItems: many(wishlistItems),
	orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	refunds: many(refunds),
	orderItems: many(orderItems),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({one}) => ({
	user: one(users, {
		fields: [wishlistItems.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id]
	}),
}));

export const refundsRelations = relations(refunds, ({one}) => ({
	order: one(orders, {
		fields: [refunds.orderId],
		references: [orders.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));