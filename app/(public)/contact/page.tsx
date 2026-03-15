import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Lucky Bee Press Wholesale",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl py-16 px-4">
      <h1 className="text-3xl font-semibold">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        Have a question about your wholesale account, an order, or our products?
        We&apos;d love to hear from you.
      </p>

      <section className="mt-10 flex flex-col items-center gap-4 text-center rounded-xl bg-secondary/40 p-8">
        <Mail className="size-8 text-primary-text" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Get in Touch</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Questions about wholesale, orders, or products? We typically respond
          within 24 hours.
        </p>
        <a
          href="mailto:luckybeepress@gmail.com"
          className="text-lg font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          luckybeepress@gmail.com
        </a>
      </section>

      <div className="relative mt-10 flex flex-col items-center gap-5 text-center py-6">
        <div className="honeycomb-bg opacity-10 absolute -inset-6 -z-10 rounded-2xl" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Interested in wholesale?</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          If you&apos;re a retailer looking to carry Lucky Bee Press products,
          start by applying for a wholesale account.
        </p>
        <Button asChild size="lg">
          <Link href="/apply">Apply for Wholesale</Link>
        </Button>
      </div>
    </div>
  );
}
