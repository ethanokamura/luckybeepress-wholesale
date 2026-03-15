import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  users,
  addresses,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  refunds,
  platformSettings,
} from "./schema";

// ─── User / Customer Schemas ─────────────────────────────────

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  businessType: z.string().min(1, "Business type is required"),
});

export const selectUserSchema = createSelectSchema(users);

export const applicationFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number is required"),
  businessType: z.string().min(1, "Business type is required"),
  ein: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  country: z.string().default("US"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileSchema = z.object({
  ownerName: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number is required").optional(),
  businessName: z.string().min(1, "Business name is required").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// ─── Address Schemas ─────────────────────────────────────────

export const insertAddressSchema = createInsertSchema(addresses, {
  recipientName: z.string().min(1, "Recipient name is required"),
  street1: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
});

export const selectAddressSchema = createSelectSchema(addresses);

export const addressFormSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(1, "Recipient name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  country: z.string().default("US"),
  isDefault: z.boolean().default(false),
});

// ─── Product Schemas ─────────────────────────────────────────

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

// ─── Category Schemas ────────────────────────────────────────

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Category name is required"),
});
export const selectCategorySchema = createSelectSchema(categories);

// ─── Cart Schemas ────────────────────────────────────────────

export const insertCartItemSchema = createInsertSchema(cartItems);
export const selectCartItemSchema = createSelectSchema(cartItems);

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  lineItemType: z.enum(["single", "box_set"]).default("single"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const updateCartQuantitySchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be positive"),
});

// ─── Order Schemas ───────────────────────────────────────────

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export const placeOrderSchema = z.object({
  addressId: z.string().uuid().optional(),
  newAddress: addressFormSchema.optional(),
  paymentMethod: z.enum(["credit_card", "net_30"]),
  notes: z.string().max(500).optional(),
});

// ─── Order Item Schemas ──────────────────────────────────────

export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);

// ─── Refund Schemas ──────────────────────────────────────────

export const insertRefundSchema = createInsertSchema(refunds, {
  reason: z.string().min(1, "Refund reason is required"),
});
export const selectRefundSchema = createSelectSchema(refunds);

// ─── Platform Settings Schemas ───────────────────────────────

export const insertPlatformSettingSchema = createInsertSchema(platformSettings);
export const selectPlatformSettingSchema = createSelectSchema(platformSettings);

// ─── Type Exports ────────────────────────────────────────────

export type User = z.infer<typeof selectUserSchema>;
export type Address = z.infer<typeof selectAddressSchema>;
export type Product = z.infer<typeof selectProductSchema>;
export type Category = z.infer<typeof selectCategorySchema>;
export type CartItem = z.infer<typeof selectCartItemSchema>;
export type Order = z.infer<typeof selectOrderSchema>;
export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type Refund = z.infer<typeof selectRefundSchema>;
export type PlatformSetting = z.infer<typeof selectPlatformSettingSchema>;
