# Lucky Bee Press Wholesale Platform

Everything below is built and working on the new site. This covers the customer-facing shop and your admin dashboard.

---

## For your customers

### Applying for an account

New buyers fill out a short application — business name, contact info, shipping address, and an optional resale certificate upload. They get a confirmation email right away, and once you approve them, they get a welcome email with a link to sign in.

Pending applicants can log in but they'll see a "we're reviewing your application" page until you approve them. No pricing or ordering access until then.

### Browsing the catalog

All 305 products from your Faire catalog are already loaded in, including box set pairings. Customers can:

- Search by name, SKU number, or keyword (includes semantic search powered by AI embeddings when available, with fallback to text matching)
- Filter by category (all 26 of your Faire categories carried over), product type (singles vs box sets), and badges (best sellers, new arrivals, featured)
- Toggle between "available only" and showing everything

Each product card shows the SKU number, primary image, wholesale and retail prices, and any badges. Box set pricing shows underneath when applicable.

### Product detail pages

Full product pages with multiple images, pricing for both singles and box sets (where available), material specs (100% cotton cardstock, hand-mixed inks, recycled envelope, A2 size), and seasonal badges with order-by dates.

### Wishlist

Customers can save products from the catalog grid (heart icon on each card) or from the product detail page. Wishlist items can be moved to cart with one click (adds the minimum quantity as singles).

### Cart and checkout

The cart enforces your business rules automatically:

- Singles must be ordered in multiples of 6, box sets in multiples of 4
- First-time buyers see a $150 minimum, returning customers see $100 (both configurable)
- When below the minimum, a "Build Your Order" section suggests products from categories they haven't added yet
- Flat $15 shipping added to every order (configurable)
- Tax-exempt accounts show $0 tax
- Customers with a custom discount see it applied with the percentage and savings shown

At checkout, customers pick from their saved shipping addresses, choose credit card or Net 30 (if you've enabled it for them), and can leave order notes (like "please pack flat").

### Orders

Customers can see their full order history, track shipments, download invoice PDFs, and reorder previous orders with one click (pre-fills the cart with available items). They can cancel orders that are still pending or confirmed — cancellation auto-refunds credit card payments or voids Net 30 invoices.

### Account settings

Customers manage their own profile info (name, business name, email, phone), password (requires current password to change), and shipping addresses (add, edit, set a default, delete — must keep at least one).

### Emails

Customers get emails for:
- Application received (immediate confirmation)
- Application approved (with login link) or rejected (with optional note)
- Order confirmation with line items, totals, and shipping address
- Shipping notification with tracking number
- Cancellation and refund confirmations
- A reorder reminder ~5 weeks after their last order (configurable), featuring their top items from the previous order

---

## For you (admin dashboard)

### Dashboard home

When you sign in, you see what needs your attention: pending applications, new orders since your last login, overdue Net 30 invoices, at-risk customers (no order in 90+ days), and a 30-day activity snapshot (orders, revenue, new accounts approved).

### Application queue

Review applications one by one — see all their business info and resale certificate. One-click approve (with optional tax-exempt checkbox) or reject with a note.

### Customer management

Full customer list with search and filters. Each customer page shows their business info, order history, lifetime value, returning status, and saved addresses. You can:
- Toggle Net 30 eligibility (manual toggle, not automatic)
- Toggle tax-exempt status
- Set a custom discount percentage (visible to the customer in their cart)
- Add private internal notes (only you can see these)
- Send a re-engagement email to customers who haven't ordered recently

### Order management

Filterable order list with batch operations — select multiple orders and update status in one go. On each order you can enter a tracking number (customer gets notified automatically), issue full or partial refunds, generate packing slip PDFs (single or batch up to 50), and cancel with a logged reason.

### Manual order creation

Create orders on behalf of any customer. Their pricing, discount, and Net 30 eligibility apply automatically. You can override the order minimum with a reason that gets logged. The customer gets a confirmation email and you get a new-order notification.

### Product catalog

Full product management with up to 4 image URLs per product, availability toggle, badge controls (best seller, new arrival, featured with configurable cap), seasonal tags, and sort-order control within categories.

Batch actions let you select multiple products and enable/disable them, move them to a different category, or delete them.

### Categories

Create, rename, reorder, and delete categories. If a category has products, you'll be prompted to reassign them before deleting. Categories that support box sets are flagged — currently Thank You, Holiday, Christmas, Hanukkah, and Season's Greetings.

### Invoices

See all Net 30 invoice statuses pulled from Stripe — sent, viewed, paid, overdue. You can mark invoices as paid manually (for checks or other off-platform payments), void them, or issue credit notes.

### Analytics

All on one page in plain tables:
- Revenue forecast with monthly revenue history and active customer count
- Best sellers ranked by units sold (last 90 days)
- Revenue and units by category (last 90 days)
- Customer lifetime value, sortable
- At-risk customer list with last order dates
- Seasonal trends (order volume by category by month)
- Current platform settings for reference

### Line sheet export

Generate a print-ready PDF of your catalog (filterable by category) with product names, wholesale and retail prices, increment info, seasonal tags, and box set sub-rows. Ready for trade shows or email outreach.

### Platform settings

All the business rules are configurable without touching code:
- Shipping rate (default $15)
- Order minimums for new ($150) and returning ($100) customers
- Max featured products (default 12)
- At-risk customer threshold (default 90 days)
- Reorder reminder delay (default 35 days)
- Net 30 eligibility threshold (stored in settings; Net 30 is toggled manually per customer)
- Admin notification email

---

## Payments

Credit card payments go through Stripe Checkout. Net 30 orders generate a Stripe invoice that gets emailed to the customer with a "Pay Now" link. Stripe handles the payment reminders (7 days before due, on due date, and after if overdue). Refunds process automatically through Stripe for credit card orders; Net 30 invoices get voided or credited.

---

## Invoice PDFs

Customers and admins can download invoice PDFs for any order. The PDF includes product images, SKUs, line items with quantities and pricing (singles and box sets shown separately), shipping address, order totals with any discount applied, and Lucky Bee Press branding.

---

## Product data

All 305 products migrated from your Faire export. Singles and box sets that were separate listings on Faire are now merged into single products (e.g., "Merry Christmas Letter" shows both the $3/card singles option and the $11/box option on one page). All 26 categories, SKUs, images, descriptions, and pricing carried over.

---

## Automatic emails

- **New order notification** — you get an email whenever an order comes in with the customer name, order number, total, and payment method
- **Low-activity digest** — every Monday morning at 8 AM, a summary of at-risk customers (only if there are any)
- **Order status emails** — customers hear when their order ships (with tracking), gets cancelled, or receives a refund
- **Application emails** — applicants get notified on submission, approval, or rejection
- **Reorder reminders** — customers get a reminder after the configured delay (default 35 days) with their top items from the last order

---

## Test coverage

The platform has 489 automated tests:
- **287 unit tests** (Vitest) covering server actions, database queries, auth, email sending, and Stripe webhook handling
- **202 end-to-end tests** (Playwright) covering every page, flow, and edge case across the customer shop and admin dashboard

See `e2e/E2E_COVERAGE.md` for the full breakdown of what's tested.
