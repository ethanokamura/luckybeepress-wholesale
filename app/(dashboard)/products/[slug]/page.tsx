"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  getDocs,
  query,
  where,
  limit,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { collections, formatPrice } from "@/lib/firebase-helpers";
import { db } from "@/lib/firebase";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { WHOLESALE_PRICING } from "@/types/products";
import type { Product, Cart, CartItem } from "@/types";
import { Minus, Plus } from "lucide-react";

type OrderType = "singles" | "box";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<OrderType>("singles");
  const [singleQty, setSingleQty] = useState<number>(
    WHOLESALE_PRICING.SINGLE_MIN_QTY
  );
  const [boxQty, setBoxQty] = useState<number>(WHOLESALE_PRICING.BOX_MIN_QTY);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const q = query(
          collections.products,
          where("slug", "==", slug),
          where("status", "==", "active"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProduct(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const getPrice = () => {
    if (!product) return 0;
    if (orderType === "box" && product.boxWholesalePrice) {
      return product.boxWholesalePrice;
    }
    return product.wholesalePrice;
  };

  const getQuantity = () => {
    return orderType === "box" ? boxQty : singleQty;
  };

  const getTotalCards = () => {
    if (orderType === "box") {
      return boxQty * WHOLESALE_PRICING.CARDS_PER_BOX;
    }
    return singleQty;
  };

  const getTotal = () => {
    return getPrice() * getQuantity();
  };

  const handleAddToCart = async () => {
    if (!firebaseUser || !product) return;
    console.log("=== DEBUG ADD TO CART ===");
    console.log("firebaseUser:", firebaseUser);
    console.log("firebaseUser.uid:", firebaseUser?.uid);
    console.log("product:", product?.id);
    setAddingToCart(true);
    try {
      const cartRef = doc(db, "carts", firebaseUser.uid);
      const cartSnap = await getDoc(cartRef);

      const itemName =
        orderType === "box"
          ? `${product.name} (Box of ${WHOLESALE_PRICING.CARDS_PER_BOX})`
          : product.name;

      const newItem: CartItem = {
        productId: product.id,
        variantId: orderType === "box" ? "box" : null,
        name: itemName,
        sku: product.sku || null,
        image: product.images?.[0] || null,
        price: getPrice(),
        quantity: getQuantity(),
        addedAt: Timestamp.now(),
      };

      if (cartSnap.exists()) {
        console.log("Updating cart! cartSnap.exists()");
        const cart = cartSnap.data() as Cart;
        const existingItemIndex = cart.items.findIndex(
          (item) =>
            item.productId === product.id &&
            item.variantId === newItem.variantId
        );

        if (existingItemIndex >= 0) {
          const updatedItems = [...cart.items];
          updatedItems[existingItemIndex].quantity += getQuantity();
          await updateDoc(cartRef, {
            items: updatedItems,
            itemCount: updatedItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            subtotal: updatedItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
            updatedAt: Timestamp.now(),
          });
        } else {
          await updateDoc(cartRef, {
            items: arrayUnion(newItem),
            itemCount: cart.itemCount + getQuantity(),
            subtotal: cart.subtotal + getTotal(),
            updatedAt: Timestamp.now(),
          });
        }
      } else {
        console.log("Creating cart! cartSnap does not exist");
        const newCart: Omit<Cart, "id"> = {
          userId: firebaseUser.uid,
          sessionId: null,
          items: [newItem],
          itemCount: getQuantity(),
          subtotal: getTotal(),
          couponCode: null,
          discount: 0,
          expiresAt: null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        console.log("Creating cart with:", newCart);
        await setDoc(cartRef, newCart);
      }

      router.push("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!product) {
    return (
      <AuthGuard requireAuth requireApproval>
        <div className="text-center py-16">
          <Image
            src="/logo.svg"
            alt="Lucky Bee Press"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This product doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.push("/products")}>
            Back to Products
          </Button>
        </div>
      </AuthGuard>
    );
  }

  const isOutOfStock = product.inventory <= 0;
  const hasBoxOption = product.hasBoxOption && product.boxWholesalePrice;

  return (
    <AuthGuard requireAuth requireApproval>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          ← Back to Products
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-lg mx-auto">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  width={1028}
                  height={1028}
                  className="object-cover"
                />
              ) : (
                <Image
                  src="/logo.svg"
                  alt="Lucky Bee Press"
                  width={1028}
                  height={1028}
                  className="object-cover"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              {product.category}
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>

            {/* Pricing Display */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(product.wholesalePrice)}
                </span>
                <span className="text-muted-foreground">/card</span>
              </div>
              {hasBoxOption && (
                <p className="text-lg text-foreground mt-1">
                  or{" "}
                  <span className="font-bold text-primary">
                    {formatPrice(product.boxWholesalePrice!)}
                  </span>
                  /box ({WHOLESALE_PRICING.CARDS_PER_BOX} cards)
                </p>
              )}
              {product.retailPrice && (
                <p className="text-sm text-muted-foreground mt-1">
                  Suggested retail: {formatPrice(product.retailPrice)}/card
                </p>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm text-muted-foreground mb-6">
              <p>{product.description}</p>
            </div>

            {/* Product specs */}
            <div className="border rounded-lg p-4 mb-6 bg-muted/30">
              <h3 className="font-medium mb-2">Product Details</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standard A2 size (5.5&quot;W × 4.25&quot;H)</li>
                <li>• Letterpress printed on 100% cotton cardstock</li>
                <li>• Hand-mixed inks for unique color quality</li>
                <li>• Includes recycled envelope</li>
                <li>• SKU: {product.sku}</li>
              </ul>
            </div>

            {/* Order Options */}
            {!isOutOfStock ? (
              <div className="space-y-6">
                {/* Order Type Selection */}
                {hasBoxOption && (
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Order Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOrderType("singles")}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          orderType === "singles"
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground"
                        }`}
                      >
                        <p className="font-medium">Single Cards</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.wholesalePrice)}/card
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Min. {WHOLESALE_PRICING.SINGLE_MIN_QTY} cards
                        </p>
                      </button>
                      <button
                        onClick={() => setOrderType("box")}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          orderType === "box"
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground"
                        }`}
                      >
                        <p className="font-medium">Box Sets</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.boxWholesalePrice!)}/box
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Min. {WHOLESALE_PRICING.BOX_MIN_QTY} boxes (
                          {WHOLESALE_PRICING.CARDS_PER_BOX} cards each)
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm mb-2 text-muted-foreground">
                    *Sold increments of{" "}
                    {orderType === "box"
                      ? WHOLESALE_PRICING.BOX_MIN_QTY
                      : WHOLESALE_PRICING.SINGLE_MIN_QTY}
                  </label>
                  <div className="flex justify-end w-full items-start gap-4  p-4">
                    <div className="flex flex-col items-end w-32">
                      <p className="text-4xl font-bold">
                        {formatPrice(getTotal())}
                      </p>{" "}
                      <p className="text-md text-muted-foreground">
                        (x{getTotalCards()}{" "}
                        {orderType === "box" ? "boxes" : "cards"})
                      </p>
                    </div>
                    <div className="flex items-center mt-1 gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (orderType === "box") {
                            setBoxQty(boxQty + WHOLESALE_PRICING.BOX_MIN_QTY);
                          } else {
                            setSingleQty(
                              singleQty + WHOLESALE_PRICING.SINGLE_MIN_QTY
                            );
                          }
                        }}
                      >
                        <Plus width={14} height={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (orderType === "box") {
                            setBoxQty(
                              Math.max(
                                WHOLESALE_PRICING.BOX_MIN_QTY,
                                boxQty - WHOLESALE_PRICING.BOX_MIN_QTY
                              )
                            );
                          } else {
                            setSingleQty(
                              Math.max(
                                WHOLESALE_PRICING.SINGLE_MIN_QTY,
                                singleQty - WHOLESALE_PRICING.SINGLE_MIN_QTY
                              )
                            );
                          }
                        }}
                        disabled={
                          orderType === "box"
                            ? boxQty <= WHOLESALE_PRICING.BOX_MIN_QTY
                            : singleQty <= WHOLESALE_PRICING.SINGLE_MIN_QTY
                        }
                      >
                        <Minus width={14} height={14} />
                      </Button>
                    </div>
                  </div>

                  {orderType === "box" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      = {getTotalCards()} cards total
                    </p>
                  )}
                </div>

                {/* Add to Cart */}
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-muted-foreground">
                  This product is currently out of stock.
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Tags:{" "}
                  {product.tags.map((tag, index) => (
                    <span key={tag}>
                      {tag}
                      {index < product.tags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
