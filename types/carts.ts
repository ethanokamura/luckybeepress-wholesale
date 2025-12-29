import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";
import { Timestamp } from "firebase/firestore";

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  image: string | null;
  price: number; // snapshot at time of adding
  quantity: number;
  addedAt: Timestamp;
}

export interface Cart extends FirebaseDoc {
  userId: string | null; // null for guest carts
  sessionId: string | null; // for guest carts
  items: CartItem[];

  // Calculated fields (update on item change)
  itemCount: number;
  subtotal: number; // in cents

  // Optional
  couponCode: string | null;
  discount: number;

  // Expiry for abandoned carts
  expiresAt: Timestamp | null;
}

export type CreateCart = CreateDoc<Cart>;
export type UpdateCart = UpdateDoc<Cart>;
