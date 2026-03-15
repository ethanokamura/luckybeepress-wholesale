# LuckyBeePress Wholesale — Product Specification

---

## About

LuckyBeePress Wholesale is a custom B2B e-commerce platform for Lucky Bee Press, an established letterpress stationery business. It replaces their Faire.com dependency, giving a small but loyal base of wholesale customers a direct, lower-friction way to reorder. The platform is designed for a solo operator managing a modest number of accounts — not high daily order volume, but high relationship value per customer.

### Brand Credibility
- **17+ years in business** on Etsy (established 2008)
- **5-star overall rating** with 2,000+ reviews and 10,000+ sales
- Hand-mixed inks and 100% cotton cardstock — premium artisan quality
- Eco-conscious: Uses recycled envelopes

### Context
Lucky Bee Press still sells on Faire and Etsy. This platform is for her loyal wholesale customers who want a direct relationship with lower fees. Order volume will be low — the product needs to be reliable and easy to operate solo, not built for scale.

---

## Product Specifications

**Single Cards**
- Sold in increments of 6 cards
- $3 per card ($18 per set/increment)
- All available card designs sold as singles
- Standard A2 size (5.5"W × 4.25"H)
- Letterpress printed on 100% cotton cardstock with recycled envelope

**Box Sets**
- Sold in increments of 4 boxes (each box contains 6 cards)
- $11 per box ($44 per set/increment)
- Only available for Holiday and Thank You card designs
- Retail-ready packaging for gift shop displays

---

## Goals & Objectives

- **Replace Faire for loyal customers**: Eliminate 15–25% marketplace commission for the customers who already know and trust Lucky Bee Press
- **Streamline ordering**: Fast browsing, filtering, and reordering for retail buyers
- **Reduce admin overhead**: Simple tools a solo owner can operate without developer help
- **Build direct relationships**: Own customer data and communication channels

### Success Metrics
- Smooth migration of existing direct customers from Faire
- Repeat order rate from existing accounts
- Reduced time spent per order for admin
- $150 minimum compliance for new customers, $100 for returning customers

---

## Business Rules

### Account Approval
- New wholesale accounts enter a **pending** state immediately after registration — they cannot browse pricing or place orders until approved
- Admin reviews each application and approves or rejects it
- Rejected applicants receive an email with an explanation; approved applicants receive a welcome email with login instructions
- There is no self-serve access — every account requires manual admin approval

### Order Minimums
- **New customers** (first order ever): $150 minimum
- **Returning customers** (at least 1 completed, non-refunded prior order): $100 minimum
- The cart dynamically displays the correct minimum based on the customer's status
- Admin can override the minimum when creating a manual order, with a required reason logged

### Quantity Increments
- Singles: must be ordered in multiples of 6
- Box sets: must be ordered in multiples of 4
- The cart enforces this with clear error messaging — customers cannot proceed until increments are correct

### Product Availability
- There is no inventory tracking. Lucky Bee Press prints on demand.
- Products are either **available** or **unavailable** — toggled manually by admin
- When a design is retired ("86'd"), admin marks it unavailable; it remains visible in the catalog as unavailable rather than disappearing entirely
- Unavailable products cannot be added to cart

### Shipping
- Flat rate: **$15 per order**
- Displayed as a line item in cart, checkout summary, order confirmation emails, and invoices
- Configurable by admin without a code change

### Payment Terms

**Credit Card**
- Available to all approved customers
- Payment is charged at time of order placement

**Net 30**
- Available to established customers after 3+ successful completed orders — eligibility granted manually by admin
- When a Net 30 order is placed, a Stripe Invoice is automatically generated and emailed to the customer
- The invoice email includes a "Pay Now" link — the customer pays online via credit card or ACH bank transfer through Stripe
- The invoice clearly states the due date (30 days from order date) and Lucky Bee Press contact/payment details
- Stripe handles automated payment reminders: 7 days before due, on the due date, and after if still unpaid
- Admin can see all invoice statuses (sent / viewed / paid / overdue) in real time
- Accounts with overdue invoices have Net 30 automatically suspended until resolved
- Admin can manually reinstate Net 30 eligibility after confirming payment

### Tax Exemption
- Wholesale buyers are resellers and are typically tax-exempt
- Customers upload their resale certificate during account registration (file upload)
- Admin reviews and marks accounts as tax-exempt during the approval process
- Tax-exempt accounts are not charged sales tax at checkout

### Refunds
- Admin can issue full or partial refunds from the order detail page with a required reason
- Credit card orders: payment is refunded automatically through the payment processor
- Net 30 orders: the Stripe Invoice is marked as credited/voided
- Refund history is visible to both admin and the customer on their respective order views
- Fully refunded orders do not count toward returning customer status
- Customer receives an email notification on refund

### Order Cancellation
- Customers may cancel an order only while it is in **pending** or **confirmed** status
- Once an order is marked **shipped**, cancellation is not available — customer must request a refund via email
- Admin can cancel any order at any status, with a required reason logged
- Credit card orders cancelled before shipment are automatically refunded; Net 30 invoices are voided
- Customer receives a cancellation confirmation email

---

## Pages & Features

### Public — Homepage
- Professional landing page with brand story and credibility signals
- **Featured Products** section: up to 12 admin-curated highlights
- **Best Sellers** section: manually designated by admin
- **New Arrivals** section: manually designated by admin
- Trust indicators: "17 years on Etsy", "5-star rated", "10k+ sales"
- CTAs: "Browse Catalog" (requires login), "Apply for Wholesale Account"
- Contact information: support email, phone number

### Public — Wholesale Program Page
- Explains who qualifies (retail businesses, boutiques, gift shops, stationery stores, etc.)
- Outlines program terms: minimum orders, payment options, increment rules, shipping cost
- Sets expectations before the application form — reduces unqualified applicants
- Primary CTA: "Apply for a Wholesale Account"

### Public — Login Page
- Email and password login
- "Forgot password" link → password reset email
- Link to apply if not yet a customer

---

### Customer — Account & Authentication
- Email + password authentication
- Password reset via email
- Account settings page: update name, email, password, and business contact info
- Multiple saved shipping addresses (add, edit, set default, delete)

### Customer — Account Registration (Application)
- Form fields: business name, owner/buyer name, email, phone, business type, EIN, shipping address
- File upload: resale certificate (PDF or image)
- On submit: "Your application is under review" confirmation page + confirmation email
- Cannot access pricing or ordering until approved

### Customer — Catalog & Browsing
- Search bar: search by product name or occasion/keyword
- Filter by: Category, Product Type (singles vs boxes), New Arrivals, Best Sellers, Featured, Available Only
- Products display: name, primary image, WSP, SRP, availability status
- Seasonal availability badges on relevant products (Valentine's, Mother's Day, Holiday, etc.)
- "Order by [date] to receive before the season" label on time-sensitive products
- Product detail page includes:
  - High-quality product image(s)
  - Product name and category
  - Availability status (Available / Unavailable)
  - Increment requirement (6 cards per set or 4 boxes per set)
  - Wholesale price (WSP) and suggested retail price (SRP)
  - Material specs: 100% cotton cardstock, hand-mixed inks, recycled envelope
  - Card size: A2 — 5.5" × 4.25"
  - Seasonal badge if applicable
  - Add to cart (enforces increment; unavailable products show "Currently Unavailable")
  - Add to Wishlist button

### Customer — Wishlist
- Save products without adding to cart
- Wishlist persists across sessions and logins
- "Move to Cart" button on each wishlist item
- Used to capture intent from customers not yet ready to hit the order minimum

### Customer — Cart & Checkout
- Running subtotal with dynamic minimum order indicator (shows $150 for new customers, $100 for returning)
- **"Build Your Order" helper**: when below the minimum, surfaces bestsellers from categories not yet represented in the cart
- Flat $15 shipping line item
- Quantity increment enforcement — cannot proceed to checkout with invalid quantities
- Order notes field: optional message to Lucky Bee Press (e.g., "please pack flat", "leave at back door") — shown to admin on order detail and packing slip
- Saved shipping address selector (or enter new)
- Payment method selection: Credit Card (always available) or Net 30 (shown only if eligible)
- Tax-exempt accounts display $0 tax
- Order summary: itemized products, subtotal, shipping, tax, total
- Confirm & Place Order button

### Customer — Order Management
- Order history list: order number, date, status, total
- Order detail: full line items, quantities, pricing, shipping address, payment method, order notes, status timeline
- Order status: Pending → Confirmed → Shipped → Delivered (or Cancelled)
- Tracking number shown with clickable link once shipped
- **Reorder button**: pre-populates cart with all items from a previous order
- Cancel button: visible on Pending and Confirmed orders only
- Refund history shown per order if applicable

### Customer — Notifications (Email)
All customer emails include Lucky Bee Press branding (logo, business name, contact info) in the header and footer.

- **Application received**: confirms submission, sets expectation for review timeline
- **Application approved**: welcome message, login instructions, link to browse catalog
- **Application rejected**: explanation and invitation to reach out with questions
- **Order confirmation**: order number, itemized summary, shipping address, shipping cost, total, estimated ship date (3–5 business days), contact info for questions
- **Order shipped**: order number, tracking number with link, estimated delivery
- **Order cancelled**: order number, reason if provided, refund confirmation if applicable
- **Refund issued**: order number, refund amount, reason, expected timeline for funds
- **Net 30 invoice**: generated by Stripe — includes order summary, due date, "Pay Now" link, payment instructions
- **Net 30 payment reminders**: automated by Stripe at 7 days before due, on due date, and after if overdue
- **"Your Reorder Window"**: automated email sent ~5 weeks after a customer's last order — "Your last order was 5 weeks ago, your best sellers may be running low" — includes a one-click reorder link that pre-populates their cart

---

### Admin — Dashboard (Home)
Designed for a solo operator who checks in every 1–2 days, not a live operations center. The home dashboard shows only what requires action or attention:

- **Pending Applications**: count + list of accounts awaiting review, with quick approve/reject
- **New Orders**: orders placed since last login, with quick links to each
- **Overdue Net 30 Invoices**: any invoices past due date, with days overdue
- **At-Risk Customers**: customers with no order in 90+ days (count + quick link to list)
- **Low-Activity Summary**: a simple "last 30 days" snapshot — orders placed, revenue, new accounts approved

No vanity metrics. No charts that require data to be meaningful. Just the things that need her attention today.

### Admin — Account Application Queue
- List of all pending applications with submission date
- Application detail: all submitted fields + resale certificate file preview/download
- One-click Approve or Reject with an optional note to the applicant
- Option to mark account as tax-exempt during approval
- Approved accounts move immediately to active status

### Admin — Customer Management
- Full list of all accounts with status (pending / active / suspended)
- Search and filter by name, status, last order date
- Customer detail page:
  - Business info and contact details
  - Account status and approval date
  - Returning customer status (auto-derived from completed non-refunded orders)
  - Net 30 eligibility toggle (manual, admin-only)
  - Tax-exempt status toggle
  - Custom pricing (optional flat discount percentage applied to all orders for this customer)
  - Saved shipping addresses
  - Full order history with totals
  - Lifetime order value
  - **Internal notes**: private text notes visible only to admin (e.g., "met at trade show", "prefers invoice sent to AP email", "VIP — handle carefully")
  - "At Risk" badge if no order in 90+ days, with one-click send re-engagement email

### Admin — Order Management
- Order list with filters: status, payment type, date range, customer name
- Multi-select checkboxes for batch status updates
- Batch actions: update status (confirmed / shipped / delivered / cancelled) across multiple orders at once
- Order detail page:
  - Full line items, quantities, pricing breakdown
  - Payment type and status
  - Customer info and shipping address
  - Customer order notes
  - Refund history
  - Status timeline
- Enter tracking number → customer automatically notified by email
- Mark as delivered
- **Issue Refund**: full or partial, required reason field; credit card auto-refunded, Net 30 invoice credited
- **Generate Packing Slip**: downloadable/printable PDF
  - Includes: Lucky Bee Press logo and business name, order number, date, ship-to address, itemized product names and quantities
  - Does NOT include pricing
- **Batch Packing Slip Generation**: select multiple orders and download all slips at once
- Overdue Net 30 invoices flagged with days overdue on order list and detail

### Admin — Manual Order Creation
- Create an order on behalf of any approved customer
- Select customer from dropdown (auto-applies their pricing, Net 30 eligibility, and minimum)
- Search and add products; quantity increment validation enforced
- Select payment method (Credit Card or Net 30)
- Correct minimum applied based on customer's returning status, with optional admin override + required reason logged
- $15 shipping automatically applied
- Order is flagged as "admin-created" in the record
- Customer receives standard order confirmation email

### Admin — Product Catalog Management
- Product list: name, category, type (single/box), availability status, badges (Best Seller / New Arrival / Featured)
- **Add product**: name, category, type, WSP, SRP, image upload (up to 4 images, one designated as primary), seasonal tag, "Order by" date (optional)
- **Edit product**: all fields editable
- **Availability toggle**: mark as Available or Unavailable (replaces inventory; unavailable products are not purchasable but remain visible)
- **Best Seller toggle**: manually set by admin; shown in Best Sellers section and filter
- **New Arrival toggle**: manually set by admin; shown in New Arrivals section and filter
- **Featured toggle**: pin/unpin product as Featured; up to 12 featured at a time; admin sets display order for featured products
- **Seasonal tag**: assign relevant season(s) (Valentine's, Mother's Day, Holiday, etc.) and optional "Order by [date]" recommendation
- **Drag-and-drop reordering** within categories: admin sets sort order; customer-facing catalog respects this order
- **Batch actions** (multi-select): change availability status, change category, delete with confirmation dialog; "Select all in category" option

### Admin — Category Management
- Create, rename, reorder, and delete categories
- Deletion requires all products in the category to be reassigned or deleted first (system prompts admin)
- Product creation and edit forms pull from this dynamic list
- Customer-facing catalog respects admin-set category display order

### Admin — Invoicing
- Net 30 invoices generated automatically via Stripe when a Net 30 order is placed
- Invoice emailed to customer automatically with "Pay Now" link
- Admin can view all invoice statuses: sent / viewed / paid / overdue
- Mark invoice as paid manually if payment received outside Stripe (e.g., check)
- Invoice voided on order cancellation; credited on refund
- Bulk invoice view filterable by status (all overdue, all unpaid, etc.)

### Admin — Analytics & Reporting
Designed for a small operator doing monthly production planning, not real-time monitoring.

- **Best sellers**: products ranked by units ordered over a selectable time period
- **Category performance**: revenue and units by category over time
- **Customer lifetime value**: total spend per account, sortable
- **Seasonal trends**: order volume by category by month, used to plan production runs
- **At-Risk customers**: full list of accounts with no order in 90+ days
- **Revenue forecast**: based on returning customer average order cadence, projects likely revenue over the next 30/60/90 days — a simple cash flow aid for a solo operator
- **Seasonal planner**: a calendar view showing which categories have historically peaked each month, overlaid with current product availability — helps plan what to have available and when

### Admin — Line Sheet Export
- Generate a print-ready or shareable PDF of the current catalog or a filtered subset
- Includes: product primary image, name, WSP, SRP, increment info, seasonal tag
- Filterable by category before export (e.g., "export Holiday cards only")
- Used for trade shows, email outreach to prospects, and buyer meetings

---

## Email Summary

All emails sent by the platform:

| Email | Trigger | Recipient |
|---|---|---|
| Application received | Account form submitted | Customer |
| Application approved | Admin approves account | Customer |
| Application rejected | Admin rejects account | Customer |
| Order confirmation | Order placed | Customer |
| Order shipped | Admin enters tracking number | Customer |
| Order cancelled | Order cancelled by customer or admin | Customer |
| Refund issued | Admin issues refund | Customer |
| Net 30 invoice | Net 30 order placed | Customer (via Stripe) |
| Net 30 payment reminder | 7 days before due, on due date, overdue | Customer (via Stripe) |
| Reorder Window | ~5 weeks after last order | Customer |
| New order notification | Order placed | Admin |
| Low-activity alert | Optional: weekly digest of at-risk accounts | Admin |

All customer-facing emails include: Lucky Bee Press logo, business name, reply-to email address, and phone number in the header or footer.

---

## Page & Route Map

**Public (no login required)**
- `/` — Homepage
- `/wholesale` — Wholesale Program page
- `/login` — Login
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset (via emailed link)
- `/apply` — Wholesale account application form

**Customer (login required, approved accounts only)**
- `/catalog` — Browse all products
- `/catalog/[product-slug]` — Product detail page
- `/wishlist` — Saved products
- `/cart` — Cart and checkout
- `/orders` — Order history list
- `/orders/[order-id]` — Order detail
- `/account` — Account settings (name, email, password, shipping addresses)

**Admin (separate login, admin role only)**
- `/admin` — Dashboard home
- `/admin/applications` — Pending account applications
- `/admin/applications/[id]` — Application detail
- `/admin/customers` — Customer list
- `/admin/customers/[id]` — Customer detail
- `/admin/orders` — Order list
- `/admin/orders/[id]` — Order detail
- `/admin/orders/create` — Manual order creation
- `/admin/products` — Product catalog management
- `/admin/products/new` — Add product
- `/admin/products/[id]/edit` — Edit product
- `/admin/categories` — Category management
- `/admin/invoices` — Invoice list and status
- `/admin/analytics` — Analytics & reporting
- `/admin/settings` — Platform settings (shipping rate, order minimums, etc.)

---

## Admin Settings (Configurable Without Code Changes)

- Flat shipping rate (default: $15)
- New customer order minimum (default: $150)
- Returning customer order minimum (default: $100)
- Maximum featured products (default: 12)
- At-risk customer threshold in days (default: 90)
- Reorder Window email delay in days (default: 35)
- Net 30 eligibility threshold (default: 3 completed orders)
- Admin notification email address

---

## Design Philosophy

- **Professional & Trustworthy**: Clean layouts, clear pricing and terms, prominent credibility signals (17 years, 5-star, 10k+ sales)
- **Artisan & Warm**: Warm palette (yellows, creams, natural tones), tactile imagery, emphasis on hand-crafted quality — letterpress is a premium product and the site should feel like it
- **Built for repeat users**: The primary user logs in, reorders what they know, and leaves. Every flow should be optimized for speed and minimal friction.
- **Solo-operator friendly**: The admin experience is designed for one person checking in every day or two — not a team running a fulfillment center
- **Mobile-friendly**: Customers browse on all devices. Admin is primarily desktop.
- **Faire-familiar**: Packing slip format, order status flow, WSP/SRP patterns should feel familiar to customers migrating from Faire

---

## User Journey Examples

### New Customer — Application & First Order
1. Discovers Lucky Bee Press via Instagram, trade show, or referral
2. Visits homepage, reads the Wholesale Program page
3. Submits application with EIN and resale certificate
4. Receives "under review" email; admin approves within a day or two
5. Receives welcome email with login link
6. Logs in, browses catalog using filters and search
7. Saves a few items to wishlist, adds others to cart
8. "Build Your Order" helper suggests bestsellers to reach the $150 minimum
9. Adds order note: "Please include a packing slip only, no prices"
10. Checks out with Credit Card — sees subtotal + $15 shipping
11. Receives order confirmation email
12. Receives shipping notification with tracking number
13. Returns to reorder in 4–6 weeks

### Returning Customer — Reorder
1. Receives "Your Reorder Window" email ~5 weeks after last order
2. Clicks the reorder link — cart pre-populates with previous items
3. Minimum indicator shows $100
4. Selects Net 30 (available after 3 successful orders)
5. Adjusts quantities, confirms order
6. Receives Stripe invoice via email, pays online within 30 days

### Seasonal Buyer
1. Logs in mid-October
2. Sees "Order by Nov 1 for holiday delivery" badge on Holiday products
3. Filters by Holiday, builds a box set and singles order
4. "Build Your Order" helper surfaces Thank You box sets frequently ordered with Holiday items
5. Hits $280 total, selects Net 30, confirms

### Admin — Daily Check-In
1. Opens admin dashboard
2. Sees: 1 pending application, 2 new orders, 0 overdue invoices
3. Reviews and approves the application; applicant receives welcome email
4. Opens each new order — reviews order notes, confirms, prints packing slip
5. Ships orders, enters tracking numbers — customers auto-notified
6. Done in under 20 minutes

### Admin — Monthly Production Planning
1. Opens analytics on the 1st of the month
2. Reviews best sellers — notes Valentine's designs need to be made available soon
3. Cross-references Seasonal Planner — Valentine's historically peaks in January
4. Marks 4 Valentine's designs as Available and tags them with the seasonal badge
5. Marks 2 retired designs as Unavailable
6. Pins 3 Valentine's products to Featured for the homepage
7. Exports a Valentine's line sheet PDF to send to a trade show contact

### Admin — Issuing a Refund
1. Customer emails about a damaged shipment
2. Admin opens the order detail, clicks Issue Refund
3. Selects partial refund, enters amount and reason ("damaged in transit")
4. Refund processes automatically; customer notified by email
5. Refund record logged on both admin and customer order views