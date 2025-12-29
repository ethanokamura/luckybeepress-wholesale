import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  serverTimestamp,
  collection,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  User,
  Product,
  Order,
  Cart,
  Address,
  ContactMessage,
  FirebaseDoc,
} from "@/types";

// ============================================
// Generic Converter Factory
// ============================================

/**
 * Creates a type-safe Firestore converter for any document type.
 * Automatically handles id injection on read and timestamp management on write.
 */
export function createConverter<
  T extends FirebaseDoc
>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      // Remove id from data being written (it's stored as doc ID)
      const { id, ...rest } = data;
      return rest;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        ...data,
      } as T;
    },
  };
}

// ============================================
// Pre-configured Converters
// ============================================

export const userConverter = createConverter<User>();
export const productConverter = createConverter<Product>();
export const orderConverter = createConverter<Order>();
export const cartConverter = createConverter<Cart>();
export const addressConverter = createConverter<Address>();
export const contactConverter = createConverter<ContactMessage>();

// ============================================
// Typed Collection References
// ============================================

export const collections = {
  users: collection(db, "users").withConverter(userConverter),
  products: collection(db, "products").withConverter(productConverter),
  orders: collection(db, "orders").withConverter(orderConverter),
  carts: collection(db, "carts").withConverter(cartConverter),
  contacts: collection(db, "contacts").withConverter(contactConverter),

  // Addresses are a subcollection of users
  addresses: (userId: string) =>
    collection(db, "users", userId, "addresses").withConverter(
      addressConverter
    ),
} as const;

// ============================================
// Typed Document References
// ============================================

export const docs = {
  user: (id: string) => doc(db, "users", id).withConverter(userConverter),
  product: (id: string) =>
    doc(db, "products", id).withConverter(productConverter),
  order: (id: string) => doc(db, "orders", id).withConverter(orderConverter),
  cart: (id: string) => doc(db, "carts", id).withConverter(cartConverter),
  contact: (id: string) =>
    doc(db, "contacts", id).withConverter(contactConverter),
  address: (userId: string, addressId: string) =>
    doc(db, "users", userId, "addresses", addressId).withConverter(
      addressConverter
    ),
} as const;

// ============================================
// Timestamp Helpers
// ============================================

/** Get server timestamp for new documents */
export function getCreateTimestamps() {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Get server timestamp for updates */
export function getUpdateTimestamp() {
  return {
    updatedAt: serverTimestamp(),
  };
}

/** Convert Firestore Timestamp to Date */
export function toDate(timestamp: Timestamp | null | undefined): Date | null {
  return timestamp?.toDate() ?? null;
}

/** Convert Date to Firestore Timestamp */
export function toTimestamp(date: Date | null | undefined): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

// ============================================
// Price Helpers (cents <-> dollars)
// ============================================

/** Convert cents to display price string */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Convert dollars to cents for storage */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars for forms */
export function toDollars(cents: number): number {
  return cents / 100;
}

// ============================================
// Order Number Generator
// ============================================

/** Generate a human-readable order number */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}-${random}`;
}

// ============================================
// Slug Generator
// ============================================

/** Generate URL-friendly slug from product name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
