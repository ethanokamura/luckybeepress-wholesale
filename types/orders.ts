import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";
import { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending" // just placed
  | "confirmed" // payment confirmed
  | "processing" // being prepared
  | "shipped" // in transit
  | "delivered" // completed
  | "cancelled" // cancelled by customer or admin
  | "refunded"; // money returned

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type PaymentMethod =
  | "card"
  | "paypal"
  | "apple_pay"
  | "google_pay"
  | "cash_on_delivery";

export interface OrderItem {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  image: string | null;
  price: number; // price at time of purchase
  quantity: number;
  total: number;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface ShippingInfo {
  method: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: Timestamp | null;
  shippedAt: Timestamp | null;
  deliveredAt: Timestamp | null;
}

export interface Order extends FirebaseDoc {
  // Order identification
  orderNumber: string; // human-readable, e.g., "ORD-2024-001234"
  userId: string;
  userEmail: string;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Items
  items: OrderItem[];

  // Addresses (snapshot at time of order)
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;

  // Pricing (all in cents)
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;

  // Payment
  paymentMethod: PaymentMethod;
  paymentIntentId: string | null; // Stripe/payment processor reference

  // Shipping
  shipping: ShippingInfo | null;

  // Customer notes
  notes: string | null;

  // Admin notes (not visible to customer)
  adminNotes: string | null;

  // Timestamps
  paidAt: Timestamp | null;
  cancelledAt: Timestamp | null;
  refundedAt: Timestamp | null;
}

export type CreateOrder = CreateDoc<Order>;
export type UpdateOrder = UpdateDoc<Order>;

/** Order summary for listings */
export type OrderListItem = Pick<
  Order,
  | "id"
  | "orderNumber"
  | "status"
  | "paymentStatus"
  | "total"
  | "createdAt"
  | "items"
> & {
  itemCount: number;
};
