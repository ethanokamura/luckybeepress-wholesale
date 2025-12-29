"use client";

import { useEffect, useState, useCallback } from "react";
import {
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  collections,
  docs,
  getCreateTimestamps,
  getUpdateTimestamp,
} from "@/lib/firebase-helpers";
import type {
  Product,
  ProductFilters,
  Order,
  OrderFilters,
  Cart,
  CartItem,
  User,
  Address,
  CreateAddress,
} from "@/types";

// ============================================
// Products
// ============================================

/** Fetch all active products with optional filters */
export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(
      collections.products,
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }

    if (filters?.featured) {
      q = query(q, where("featured", "==", true));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data());
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters?.category, filters?.featured]);

  return { products, loading, error };
}

/** Fetch single product by ID or slug */
export function useProduct(idOrSlug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // First try by ID
        const docSnap = await getDoc(docs.product(idOrSlug));

        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
          // Try by slug
          const q = query(
            collections.products,
            where("slug", "==", idOrSlug),
            limit(1)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            setProduct(snapshot.docs[0].data());
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [idOrSlug]);

  return { product, loading, error };
}

// ============================================
// Cart
// ============================================

/** Manage user's cart */
export function useCart(userId: string | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const q = query(
        collections.carts,
        where("userId", "==", userId),
        limit(1)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setCart(snapshot.docs[0].data());
        } else {
          setCart(null);
        }
        setLoading(false);
      });
    };

    setup();

    return () => {
      unsubscribe?.();
      setCart(null);
    };
  }, [userId]);

  const addToCart = useCallback(
    async (item: Omit<CartItem, "addedAt">) => {
      if (!userId || !cart) return;

      const existingIndex = cart.items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Update quantity
        newItems = cart.items.map((i, idx) =>
          idx === existingIndex
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        newItems = [
          ...cart.items,
          { ...item, addedAt: serverTimestamp() }, // Will be converted to Timestamp
        ] as CartItem[];
      }

      const subtotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

      await updateDoc(docs.cart(cart.id), {
        items: newItems,
        subtotal,
        itemCount,
        ...getUpdateTimestamp(),
      });
    },
    [userId, cart]
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId: string | null) => {
      if (!cart) return;

      const newItems = cart.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      );

      const subtotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

      await updateDoc(docs.cart(cart.id), {
        items: newItems,
        subtotal,
        itemCount,
        ...getUpdateTimestamp(),
      });
    },
    [cart]
  );

  const clearCart = useCallback(async () => {
    if (!cart) return;

    await updateDoc(docs.cart(cart.id), {
      items: [],
      subtotal: 0,
      itemCount: 0,
      couponCode: null,
      discount: 0,
      ...getUpdateTimestamp(),
    });
  }, [cart]);

  return {
    cart,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
  };
}

// ============================================
// Orders
// ============================================

/** Fetch user's orders */
export function useOrders(userId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const q = query(
        collections.orders,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map((doc) => doc.data()));
        setLoading(false);
      });
    };

    setup();

    return () => {
      unsubscribe?.();
      setOrders([]);
    };
  }, [userId]);

  return { orders, loading };
}

/** Fetch single order */
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribe = onSnapshot(docs.order(orderId), (snapshot) => {
        setOrder(snapshot.exists() ? snapshot.data() : null);
        setLoading(false);
      });
    };

    setup();

    return () => {
      unsubscribe?.();
      setOrder(null);
    };
  }, [orderId]);

  return { order, loading };
}

// ============================================
// Addresses
// ============================================

/** Fetch user's addresses */
export function useAddresses(userId: string | null) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setup = () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribe = onSnapshot(collections.addresses(userId), (snapshot) => {
        setAddresses(snapshot.docs.map((doc) => doc.data()));
        setLoading(false);
      });
    };

    setup();

    return () => {
      unsubscribe?.();
      setAddresses([]);
    };
  }, [userId]);

  const addAddress = useCallback(
    async (data: CreateAddress) => {
      if (!userId) return;

      const docRef = await addDoc(collections.addresses(userId), {
        ...data,
        userId,
        ...getCreateTimestamps(),
      } as CreateAddress);

      return docRef.id;
    },
    [userId]
  );

  const updateAddress = useCallback(
    async (addressId: string, data: Partial<Address>) => {
      if (!userId) return;

      await updateDoc(docs.address(userId, addressId), {
        ...data,
        ...getUpdateTimestamp(),
      });
    },
    [userId]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!userId) return;
      await deleteDoc(docs.address(userId, addressId));
    },
    [userId]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!userId) return;

      const batch = writeBatch(db);

      // Unset current defaults
      addresses
        .filter((a) => a.isDefault)
        .forEach((a) => {
          batch.update(docs.address(userId, a.id), { isDefault: false });
        });

      // Set new default
      batch.update(docs.address(userId, addressId), { isDefault: true });
      batch.update(docs.user(userId), { defaultAddressId: addressId });

      await batch.commit();
    },
    [userId, addresses]
  );

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}

// ============================================
// Admin: All Orders
// ============================================

/** Admin hook: fetch all orders with filters */
export function useAdminOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collections.orders, orderBy("createdAt", "desc"));

    if (filters?.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters?.paymentStatus) {
      q = query(q, where("paymentStatus", "==", filters.paymentStatus));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => doc.data()));
      setLoading(false);
    });

    return unsubscribe;
  }, [filters?.status, filters?.paymentStatus]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: Order["status"]) => {
      await updateDoc(docs.order(orderId), {
        status,
        ...getUpdateTimestamp(),
      });
    },
    []
  );

  return { orders, loading, updateOrderStatus };
}

// ============================================
// Admin: Customers
// ============================================

/** Admin hook: fetch all customers */
export function useAdminCustomers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collections.users,
      where("role", "==", "customer"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map((doc) => doc.data()));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { customers, loading };
}
