import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Package, Truck, Star } from "lucide-react";

export default function WholesalePage() {
  return (
    <div className="mx-auto max-w-4xl py-16 px-4 flex flex-col gap-14">
      {/* Hero with image overlay */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="relative aspect-[2/1] w-full">
          <Image
            src="/images/cardset_03.JPG"
            alt="Lucky Bee Press card sets"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-warm-black/70 via-warm-black/50 to-warm-black/20" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 px-8 sm:px-12 md:px-16">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Wholesale Program
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Lucky Bee Press offers reduced wholesale pricing for retail businesses,
              boutiques, gift shops, stationery stores, and online retailers.
            </p>
            <p className="text-sm text-white/60">
              Handcrafted since 2008 &middot; 5-star rated &middot; 10,000+ cards sold
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Who Qualifies</h2>
        <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground" role="list">
          {[
            "Retail businesses with a valid resale certificate",
            "Boutiques, gift shops, stationery stores, bookstores",
            "Museum and gallery shops",
            "Online retailers with a web presence",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-semibold">What We Offer</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="bg-secondary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5 text-primary-text" />
                Single Cards
              </CardTitle>
              <CardDescription>
                Reduced wholesale rates &middot; Sold in sets of 6 &middot; All designs available
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-secondary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5 text-primary-text" />
                Box Sets
              </CardTitle>
              <CardDescription>
                Retail-ready packaging &middot; Sold in sets of 4 boxes &middot;
                Holiday &amp; Thank You designs
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-secondary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary-text" />
                Flexible Payment
              </CardTitle>
              <CardDescription>
                Credit card or Net 30 terms for established accounts
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-secondary/30 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-5 text-primary-text" />
                Shipping
              </CardTitle>
              <CardDescription>
                Flat rate shipping &middot; Ships within 5-7 business days
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">How It Works</h2>
        <div className="flex flex-col" role="list">
          {[
            {
              step: 1,
              title: "Apply",
              description:
                "Send us your store information and resale certificate",
            },
            {
              step: 2,
              title: "Get approved",
              description:
                "We review applications within 1-2 business days",
            },
            {
              step: 3,
              title: "Browse & order",
              description:
                "Access the full catalog with wholesale pricing",
            },
          ].map((item, index) => (
            <div key={item.step} className="flex items-start gap-4" role="listitem">
              {/* Number circle + connecting line */}
              <div className="flex flex-col items-center">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </span>
                {index < 2 && (
                  <div className="w-px grow border-l border-border my-1 min-h-6" aria-hidden="true" />
                )}
              </div>
              {/* Text */}
              <div className={`flex flex-col gap-0.5 ${index < 2 ? "pb-5" : ""}`}>
                <strong className="text-sm text-foreground">{item.title}</strong>
                <span className="text-sm text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <div className="relative flex flex-col items-center gap-5 text-center py-4">
        <div className="honeycomb-bg opacity-10 absolute -inset-6 -z-10 rounded-2xl" aria-hidden="true" />
        <h2 className="text-2xl font-heading font-semibold">Interested?</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Send us your store information and we&apos;ll set you up with access
          to our full wholesale catalog.
        </p>
        <Button asChild size="lg">
          <Link href="/apply">Apply for a Wholesale Account</Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Applications reviewed within 1-2 business days
        </p>
      </div>
    </div>
  );
}
