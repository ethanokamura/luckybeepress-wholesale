"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { firebaseUser, isApproved, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      return;
    } else if (isApproved) {
      router.push("/products");
    } else {
      router.push("/account");
    }
  }, [firebaseUser, isApproved, loading, router]);

  return (
    <main className="h-screen honeycomb-pattern">
      <div className="py-12 sm:py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <Image
            src="/tag.png"
            alt="Lucky Bee Press"
            width={400}
            height={80}
            className="mx-auto mb-6 w-64 sm:w-80 lg:w-96 h-auto"
          />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Welcome to <span className="text-primary">Lucky Bee Press</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Artisan letterpress greeting cards, crafted with hand-mixed inks on
            100% cotton cardstock. Wholesale orders for boutiques and retail
            stores.
          </p>

          {/* Trust badges */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="text-primary">★</span>
              5-Star Rating (2,000+ Reviews)
            </span>
            <span className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              17+ Years in Business
            </span>
            <span className="flex items-center gap-2">
              <span className="text-primary">♻</span>
              Eco-Friendly Materials
            </span>
          </div>

          {/* CTA */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            {loading ? (
              <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
            ) : firebaseUser ? (
              isApproved ? (
                <Link href="/products" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Products
                  </Button>
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Your account is pending approval. We&apos;ll notify you once
                    you&apos;re approved!
                  </p>
                  <Link href="/account">
                    <Button variant="outline">View Account Status</Button>
                  </Link>
                </div>
              )
            ) : (
              <>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Apply for Wholesale
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
