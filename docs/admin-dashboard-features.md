# Lucky Bee Press wholesale admin dashboard

## What it does

This is the back office for managing your wholesale business. Everything you'd normally do in spreadsheets, email threads, and Stripe tabs is in one place.

You log in at `/admin` with your regular account. One login, same password.

---

## Your daily check-in

When you open the dashboard, you see what needs attention right now:

- How many wholesale applications are waiting for review
- New orders since you last logged in
- Any overdue Net 30 invoices
- Customers who haven't ordered in a while
- A 30-day snapshot of orders, revenue, and new accounts

Each section links directly to where you take action. No digging around.

---

## Wholesale applications

When a retailer applies, their application lands in a queue sorted oldest-first. You can see their business info, EIN, and download their resale certificate.

One click to approve. One click to reject. You can add a note either way, and mark them tax-exempt during approval if their paperwork checks out. They get an email automatically.

---

## Customer management

Every wholesale account in one searchable list. Filter by status, search by name or email.

Each customer profile shows their business info, order history, lifetime spend, addresses, and whether they're a returning customer. From there you can:

- Turn Net 30 on or off (this is a manual toggle -- there's no automatic eligibility based on order count)
- Mark them tax-exempt
- Set a custom discount percentage (customers see this discount applied in their cart)
- Add private notes (only you see these)
- Send a re-engagement email to customers who haven't ordered recently

Customers who haven't ordered in 90+ days get flagged as "at risk" so they don't slip through the cracks. That 90-day threshold is adjustable in settings.

---

## Orders

All orders in a filterable table. Filter by status, payment type, date range, or customer name. Select multiple orders and batch-update their status.

Each order page has everything in one place: line items with singles and box sets broken out separately, pricing, payment info, shipping address, and any refund history.

From an order you can:

- Enter a tracking number (marks it shipped and emails the customer automatically)
- Mark it delivered
- Issue a full or partial refund (handles Stripe or Net 30 invoices)
- Cancel with a reason (auto-refunds if already paid, voids the invoice for unpaid Net 30)
- Generate a packing slip PDF (no pricing shown, just items and quantities)

You can also generate packing slips in bulk -- select up to 50 orders and download them as a single PDF.

---

## Create orders manually

Sometimes you take an order over the phone or at a trade show. The manual order form lets you:

- Pick any approved customer from a dropdown
- Search products and add them as singles or box sets (same product, separate line items with different pricing)
- Their custom discount applies automatically
- Shipping is $15 flat
- Choose credit card or Net 30 (Net 30 only shows if the customer is eligible)
- Override the order minimum if needed -- just provide a reason

The customer gets a confirmation email. You get a new-order notification email. The order is flagged as admin-created so you can tell it apart later.

---

## Singles vs. box sets

Cards are sold two ways:

- **Singles** -- increments of 6 cards at $3 per card ($18 per increment)
- **Box sets** -- increments of 4 boxes, each box holds 6 cards, at $11 per box ($44 per increment)

Box sets are available for these categories: Thank You, Holiday, Christmas, Hanukkah, and Season's Greetings. This is controlled per category via a `supportsBoxSet` flag, so if you add a new category later, you can turn on box set support for it.

On the product page, customers pick "Singles" or "Box Set" and the pricing updates. If someone orders both singles and box sets of the same card, they show up as two separate line items in the cart, on receipts, and on packing slips -- because they ship in different packaging.

---

## Products

A full product table with everything at a glance: image, name, category, wholesale and retail prices, availability, and badges.

You can toggle Best Seller, New Arrival, and Featured badges right from the list. Featured has a configurable cap (default 12).

Creating or editing a product covers: name, SKU, category, single card pricing, box set pricing (only when the category supports it), description, up to 4 images, seasonal tags, and an order-by date.

Batch actions let you select multiple products and set them available/unavailable, move them to a different category, or delete them.

Products can be reordered within categories to control how they appear in the catalog.

---

## Categories

Simple list with product counts. You can create, rename, reorder, and delete categories. Deleting a category that still has products prompts you to move them somewhere else first.

Each category can have box set support enabled or disabled with one click.

---

## Invoices

Shows all Net 30 invoices pulled directly from Stripe. Filter by status: sent, viewed, paid, or overdue.

If a customer pays by check or some other off-platform method, you can mark the invoice as paid here and it updates in Stripe. You can also void invoices or issue credit notes.

---

## Analytics

Reports are all on one page in plain tables -- no fancy charts, just the numbers:

- **Revenue forecast** -- projected revenue based on returning customer order patterns, with monthly revenue history and active customer count
- **Best sellers** -- top products by units sold over the last 90 days
- **Category performance** -- revenue and units by category over the last 90 days
- **Customer lifetime value** -- total spend per customer, sorted highest first
- **At-risk customers** -- everyone who hasn't ordered within the at-risk threshold, with their last order date
- **Seasonal trends** -- order volume by category by month over the past year
- **Platform settings** -- current configuration values displayed for reference

---

## Line sheet PDF

Generate a print-ready PDF of your catalog for trade shows. Filter by category or export everything. Each product shows its name, wholesale price, retail price, order increment, seasonal tag, and box set sub-row where applicable.

---

## Settings

You can change these yourself, no developer needed:

- Flat shipping rate (default $15)
- New customer order minimum (default $150)
- Returning customer order minimum (default $100)
- Max featured products (default 12)
- At-risk customer threshold (default 90 days)
- Reorder reminder email delay (default 35 days)
- Net 30 eligibility threshold (stored in settings but Net 30 is toggled manually per customer)
- Admin notification email address

---

## Automatic emails

- **New order notification** -- you get an email whenever an order comes in with the customer name, order number, total, and payment method
- **Low-activity digest** -- every Monday morning at 8 AM, a summary of at-risk customers lands in your inbox (only if there are any)
- **Order status emails** -- customers automatically hear when their order ships (with tracking number), gets cancelled, or receives a refund
- **Application emails** -- applicants get notified on submission (confirmation), approval (with login link), or rejection (with optional note)
- **Reorder reminders** -- customers receive a reminder email after the configured delay (default 35 days) since their last order, including their top items from that order
