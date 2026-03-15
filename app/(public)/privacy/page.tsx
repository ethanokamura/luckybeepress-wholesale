import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Lucky Bee Press Wholesale",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 2026
      </p>

      <div className="mt-8 flex flex-col gap-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Information We Collect
          </h2>
          <p>
            When you apply for a wholesale account or place an order, we collect
            the following information:
          </p>
          <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
            <li>Business name, owner name, email address, and phone number</li>
            <li>Business type and EIN (if provided)</li>
            <li>Shipping and billing addresses</li>
            <li>Resale certificate (uploaded during application)</li>
            <li>Order history and payment information</li>
            <li>Account login credentials (password stored as a secure hash)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            How We Use Your Information
          </h2>
          <ul className="flex flex-col gap-1 list-disc pl-5">
            <li>Process and fulfill wholesale orders</li>
            <li>Manage your wholesale account and verify resale eligibility</li>
            <li>Send order confirmations, shipping notifications, and invoices</li>
            <li>Send reorder reminders and relevant product updates</li>
            <li>Improve our products and services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Third-Party Services
          </h2>
          <p>We use the following third-party services to operate this platform:</p>
          <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
            <li>
              <strong>Stripe</strong> — payment processing and invoicing. Stripe
              collects and processes payment information directly. See{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Vercel</strong> — hosting and file storage (resale
              certificates, product images).
            </li>
            <li>
              <strong>Neon</strong> — database hosting for account and order data.
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Data Retention
          </h2>
          <p>
            We retain your account information and order history for as long as
            your wholesale account is active. If you request account deletion, we
            will remove your personal data within 30 days, except where we are
            required to retain records for tax or legal compliance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Your Rights
          </h2>
          <p>You may request to:</p>
          <ul className="mt-2 flex flex-col gap-1 list-disc pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and personal data</li>
            <li>Export your order history</li>
          </ul>
          <p className="mt-2">
            To make a request, contact us at{" "}
            <a
              href="mailto:luckybeepress@gmail.com"
              className="text-accent hover:underline"
            >
              luckybeepress@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Cookies
          </h2>
          <p>
            We use essential cookies only — specifically a session cookie to keep
            you signed in. We do not use tracking cookies, analytics cookies, or
            third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Contact
          </h2>
          <p>
            For questions about this privacy policy, contact us at{" "}
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
