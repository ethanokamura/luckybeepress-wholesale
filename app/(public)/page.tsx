import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Lucky Bee Press Wholesale",
  description:
    "Handcrafted letterpress stationery for wholesale buyers. Premium hand-mixed inks on 100% cotton cardstock since 2008.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const isSignedIn = !!user;

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <Image
          src="/images/cardset_01.JPG"
          alt="Lucky Bee Press card sets"
          fill
          className="hero-ken-burns object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-warm-black/30 via-warm-black/50 to-warm-black/70" />
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8 px-4 text-center animate-fade-in">
          <Image src="/logo.svg" alt="Lucky Bee Press" width={56} height={56} className="opacity-90" />
          <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Handcrafted
            <br />
            letterpress stationery.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-white/75">
            Premium hand-mixed inks on 100% cotton cardstock.
            Wholesale for retailers since 2008.
          </p>
          <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={isSignedIn ? "/catalog" : "/login"}>Browse Catalog</Link>
            </Button>
            {!isSignedIn && (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Link href="/apply">Apply for Wholesale</Link>
                </Button>
                <Link
                  href="/wholesale"
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  Learn about the program &rarr;
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <Reveal>
        <section className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground sm:gap-x-8">
            <span>Est. 2008</span>
            <span className="text-border">&middot;</span>
            <span>100% Cotton Cardstock</span>
            <span className="text-border">&middot;</span>
            <span>Hand-Mixed Inks</span>
            <span className="text-border">&middot;</span>
            <span>5-Star Rated</span>
            <span className="text-border">&middot;</span>
            <span>10,000+ Sales</span>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
