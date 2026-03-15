import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Lucky Bee Press Wholesale",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 2026
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Wholesale Account Eligibility
          </h2>
          <p>
            Lucky Bee Press wholesale accounts are available to legitimate retail
            businesses, including boutiques, gift shops, stationery stores,
            bookstores, museum shops, and online retailers. All accounts require
            manual approval. We reserve the right to approve or reject any
            application at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Pricing &amp; Order Minimums
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>Single cards</strong> — $3.00 wholesale per card, sold in
              increments of 6 cards.
            </li>
            <li>
              <strong>Box sets</strong> — $11.00 wholesale per box of 6 cards,
              sold in increments of 4 boxes. Available for select categories only.
            </li>
            <li>
              <strong>First order minimum</strong> — $150.00 (before shipping).
            </li>
            <li>
              <strong>Reorder minimum</strong> — $100.00 (before shipping) for
              customers with at least one completed order.
            </li>
            <li>
              <strong>Shipping</strong> — flat rate of $15.00 per order.
            </li>
          </ul>
          <p className="mt-2">
            Prices, minimums, and shipping rates are subject to change. Any
            changes apply to orders placed after the effective date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Payment Terms
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5">
            <li>
              <strong>Credit card</strong> — available to all approved accounts.
              Payment is charged at the time of order placement via Stripe.
            </li>
            <li>
              <strong>Net 30</strong> — available to established accounts after 3
              or more successfully completed orders, at our discretion. A Stripe
              invoice is issued with payment due within 30 days. Overdue accounts
              will have Net 30 privileges suspended until the balance is resolved.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Tax Exemption
          </h2>
          <p>
            Wholesale buyers with a valid resale certificate may be marked as
            tax-exempt. You must upload your resale certificate during the
            application process. Tax-exempt status is reviewed and granted by
            Lucky Bee Press during account approval.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Cancellations &amp; Refunds
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5">
            <li>
              Orders in <strong>Pending</strong> or <strong>Confirmed</strong>{" "}
              status may be cancelled by the customer. Once an order is marked as
              Shipped, cancellation is not available — contact us for assistance.
            </li>
            <li>
              Credit card orders cancelled before shipment are automatically
              refunded. Net 30 invoices are voided.
            </li>
            <li>
              Refunds (full or partial) may be issued at our discretion for
              damaged or defective products. Contact us with your order number and
              a description of the issue.
            </li>
            <li>
              Fully refunded orders do not count toward returning customer status
              or Net 30 eligibility.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Product Availability
          </h2>
          <p>
            Lucky Bee Press products are printed on demand. There is no inventory
            tracking — products are either available or unavailable, as indicated
            in the catalog. We reserve the right to discontinue any product at any
            time. Unavailable products remain visible in the catalog but cannot be
            ordered.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Intellectual Property
          </h2>
          <p>
            All product designs, images, and content on this platform are the
            property of Lucky Bee Press. Wholesale buyers may use product images
            for the purpose of reselling Lucky Bee Press products. Any other use
            requires written permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Account Suspension
          </h2>
          <p>
            We reserve the right to suspend or terminate any wholesale account for
            violation of these terms, non-payment of invoices, or conduct that we
            determine is harmful to our business.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Contact
          </h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a
              href="mailto:luckybeepress@gmail.com"
              className="text-accent hover:underline"
            >
              luckybeepress@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
