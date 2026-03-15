# Test Documentation

Tests for the Lucky Bee Press wholesale storefront.

## Setup

### Prerequisites

- Node.js / Bun installed
- The dev server running (or it will be started automatically for E2E)

### Environment Variables

Tests requiring authentication need these env vars:

| Variable               | Description                              |
| ---------------------- | ---------------------------------------- |
| `E2E_CUSTOMER_EMAIL`   | Email for a seeded customer account      |
| `E2E_CUSTOMER_PASSWORD`| Password for that customer account       |
| `ADMIN_EMAIL`          | Email for a seeded admin account         |
| `ADMIN_PASSWORD`       | Password for that admin account          |
| `E2E_BASE_URL`         | Base URL (default: `http://localhost:3003`) |

### Running Tests

```bash
# Run all unit tests
bun run test

# Run unit tests with coverage
bun run test --coverage

# Run all e2e tests
bunx playwright test

# Run a specific test file
bunx playwright test e2e/public-pages.spec.ts

# Run with UI mode
bunx playwright test --ui

# View the HTML report after a run
bunx playwright show-report
```

### Configuration

**Playwright** (`playwright.config.ts`):
- **Test directory:** `./e2e`
- **Browser:** Chromium (Desktop Chrome)
- **Parallelism:** Disabled (`fullyParallel: false`, `workers: 1`) — tests run sequentially since they share state
- **Timeout:** 60 seconds per test
- **Retries:** 1 locally, 2 in CI
- **Traces:** Captured on first retry
- **Screenshots:** Captured on failure
- **Dev server:** Auto-started on port 3003 via `bun run dev`

**Vitest** (`vitest.config.ts`):
- **Environment:** jsdom
- **Setup:** `tests/setup.ts` (mocks DB, auth, Stripe, Resend, Next.js cache/navigation)
- **Coverage:** scoped to `lib/admin/`, `app/admin/`, `app/api/admin/`

## Test Helpers

### `e2e/helpers/customer-auth.ts`

- **`loginAsCustomer(page)`** — Navigates to `/login`, fills email/password from env vars, clicks sign in, and waits for redirect.

### `e2e/helpers/auth.ts`

- **`loginAsAdmin(page)`** — Same flow for admin accounts.
- **`setupAuthCookie(context)`** — Injects a session cookie directly for faster auth setup.

---

## E2E Test Suites

### `public-pages.spec.ts` — Public Pages (11 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Homepage loads with hero and CTAs | Hero heading visible, "Browse Catalog" and "Apply" links present |
| Homepage shows brand story | Lucky Bee Press branding and founder name (Laurie) displayed |
| Wholesale page loads with program info | Heading, pricing ($3.00 / $11.00), and apply CTA visible |
| Apply page loads with form | Heading, business name / email / password fields, submit button |
| Apply form validates required fields | Submitting empty form stays on `/apply` (HTML5 validation blocks) |
| Contact page loads | Contact heading and email address displayed |
| Privacy page loads | Privacy heading visible |
| Terms page loads | Terms heading visible |
| Forgot password page loads | Reset password heading and email field visible |
| Navigation links work from homepage | Clicking Wholesale and Apply links navigates correctly |
| Footer links work | Contact, Privacy, and Terms footer links navigate correctly |

### `public-pages-extended.spec.ts` — Extended Public Pages (6 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Apply confirmation page loads | Confirmation/thank you message after application |
| Approval pending page loads | Pending review message for unapproved accounts |
| Reset password page loads | Reset password page renders |
| Reset password shows token error | Invalid token handled gracefully |
| Forgot password form submits | Email submitted, success message shown (no enumeration) |
| Apply form submits with valid data | Full application form fill and submit |

---

### `customer-auth.spec.ts` — Customer Authentication (9 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Protected routes redirect (x5) | `/catalog`, `/cart`, `/orders`, `/wishlist`, `/account` all redirect to `/login` when unauthenticated |
| Invalid credentials show error | Wrong password displays an error message |
| Empty password blocked | HTML5 validation prevents submission with blank password |
| Valid login works and persists | Login succeeds, session survives page reload |
| CallbackUrl preserved after login | Accessing a protected page redirects to login, then back after auth |
| Forgot password link present | Login page contains a forgot-password link |
| Apply link present | Login page contains a link to the application form |

### `customer-catalog.spec.ts` — Product Catalog (8 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Catalog loads with products | Catalog heading and at least one product card visible |
| Search by name | Typing a product name filters results |
| Search by SKU | Typing a SKU filters results |
| Empty search results | Searching for gibberish shows a no-results message |
| Category filter works | Selecting a category filters the product list |
| Clear filters resets | Clearing filters restores the full product list |
| Product cards show name, price, image | Each card displays expected product info |
| Product detail page | Clicking a product shows full details and either an add-to-cart button or unavailable state |

### `customer-cart-checkout.spec.ts` — Cart & Checkout (10 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Empty cart shows empty state | Cart page displays an empty-state message when no items |
| Add product from detail page | Clicking "Add to Cart" on a product detail page adds the item |
| Quantity increment enforcement | Quantity controls enforce min/max limits |
| Cart shows items with pricing | Subtotal, shipping, and total are displayed |
| Minimum order warning | Warning shown when cart total is below the order minimum |
| $15 shipping displayed | Flat-rate $15.00 shipping is shown |
| Update quantity | Changing quantity in cart updates totals |
| Remove items | Removing an item from the cart works |
| Checkout form elements | Payment method selector, address selector, and order notes field present |
| Place order button | Button visible when cart total meets the minimum |

### `customer-orders.spec.ts` — Order History (7 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Orders page loads | Orders heading visible |
| Empty state or order list | Shows either "no orders" or a list of orders |
| Order items display | Each order shows number, date, status, and total |
| Order detail page | Full order info: line items, shipping address, payment method |
| Reorder button present | Reorder button shown on order detail |
| Invoice download button | Download invoice button present |
| Cancel button present | Cancel button shown (for eligible orders) |
| Status badge displayed | Order status badge (e.g., pending, shipped) visible |

### `customer-wishlist.spec.ts` — Wishlist (4 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Wishlist page loads | Wishlist heading visible |
| Empty state or items shown | Shows either empty state or saved items |
| Add from product detail | "Add to Wishlist" on product detail page works |
| Item actions | Each item shows price, move-to-cart button, and remove button |

### `customer-account.spec.ts` — Customer Account (5 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Account page loads with profile form | Account settings heading and form visible |
| Shipping addresses section | Addresses section displayed |
| Profile form has all fields | Name, email, phone fields and save button |
| Can add a new address | Address form submission works |
| Password change section exists | Current/new password fields present |

### `customer-account-extended.spec.ts` — Extended Account Management (5 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Can update profile name | Name field is editable with current value |
| Can view existing addresses | Shipping addresses section visible |
| Address form has required fields | Recipient, street, city, state, zip fields present |
| Password change requires current password | Both current and new password fields shown |
| Profile save button exists | Save/update button present |

### `customer-full-flow.spec.ts` — Full Purchase Flows (3 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Browse -> add -> cart -> verify | Full happy path: catalog, product detail, add to cart, verify summary |
| Multiple products to reach minimum | Add several products to meet minimum, verify subtotal |
| Reorder flow | Click reorder on existing order, verify cart pre-populated |

### `customer-flows-extended.spec.ts` — Extended Customer Flows (6 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Wishlist to cart | Add to wishlist from product detail, then move to cart |
| Order cancellation | Cancel button visibility on eligible orders |
| Invoice download | Invoice download link/button on order detail |
| Discount visibility | Cart shows discount line if customer has custom discount |
| Session management | Logout redirects to login, protected pages inaccessible |
| Product detail images | Image gallery displays on product detail page |

---

### Admin E2E Suites

### `admin-auth.spec.ts` — Admin Authentication (7 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Unauthenticated redirects (x5) | `/admin`, `/admin/orders`, `/admin/customers`, `/admin/products`, `/admin/settings` redirect to login |
| Login page renders | Email and password fields visible |
| Login page description | Sign-in description text shown |

### `admin-dashboard.spec.ts` — Admin Dashboard (15 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Dashboard loads | Heading visible |
| KPI widgets (x4) | Pending apps, new orders, overdue invoices, at-risk customers |
| 30-day summary | Summary section with metrics |
| Sidebar navigation (x6) | Links to all admin sections work |
| Sidebar branding/user info | Admin branding and signed-in user displayed |
| Widget deep links (x2) | Applications and orders widgets link to their pages |

### `admin-applications.spec.ts` — Applications Queue (7 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Page loads | Application queue heading |
| Back to dashboard | Navigation link present |
| Table or empty state | Renders table or empty message |
| Column headers | Business Name, Owner, Email, Business Type, Submitted |
| Empty state message | Descriptive empty state |
| Back link navigates | Returns to /admin |

### `admin-customers.spec.ts` — Customer Management (10 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Page loads, search, filters | Heading, search input, status dropdown |
| Table or empty state | Customer table with correct headers |
| Customer detail navigation | Clicking customer navigates to detail |
| Back to dashboard | Navigation link |
| Filter submission | URL updates with search params |

### `admin-orders.spec.ts` — Order Management (17 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Page loads with filters | Status, payment method, date range, search |
| Create order link | Navigates to /admin/orders/create |
| Filter submission | URL updates |
| Create order form | Customer dropdown, product search, payment method, notes, totals, submit |

### `admin-products.spec.ts` — Product Management (18 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Products list | Heading, new product link, export button |
| New product form | All fields: name, SKU, category, prices, description, images, box option, toggles, seasonal, submit |

### `admin-categories.spec.ts` — Category Management (10 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Page loads | Heading, create input, add button |
| Button state | Disabled when empty, enabled with text |
| Category list | Product counts, rename/delete/reorder actions |

### `admin-settings.spec.ts` — Platform Settings (13 tests)

| Test | What it verifies |
| ---- | ---------------- |
| All settings fields | Shipping, minimums, featured limit, thresholds, delays, email |
| Save button | Present and functional |
| Field descriptions | Each field has description text |
| Fields accept input | Input is editable |

### `admin-analytics.spec.ts` — Analytics (12 tests)

| Test | What it verifies |
| ---- | ---------------- |
| All report sections | Revenue forecast, best sellers, category performance, CLV, at-risk, seasonal, platform settings |
| Table headers | Correct columns in each section |
| All sections render | No errors across all sections |

### `admin-extended.spec.ts` — Extended Admin Flows (11 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Application detail page | Navigate to detail, approve/reject buttons present |
| Customer detail actions | Net30, tax exempt, discount controls visible |
| Order detail management | Status, tracking, payment controls |
| Invoices page | Page loads, table or empty state |
| Product editing | Navigate to edit page, form fields present |
| Settings save | Save button works, success feedback shown |
| Manual order creation | All form fields present on create order page |

---

## Unit / Integration Tests

### `tests/admin/auth.test.ts` — Admin Auth (9 tests)

| Test | What it verifies |
| ---- | ---------------- |
| getCurrentUser | Returns null without session, returns user with session |
| getAdminUser | Returns null for non-admin, returns user for admin |
| requireAuth | Returns user when authenticated, redirects when not |
| requireAdmin | Returns admin, redirects for non-admin and no session |

### `tests/admin/queries.test.ts` — Admin Queries (61 tests)

Covers all admin query functions: pending applications, new orders, at-risk customers, 30-day summary, application/customer/order detail, paginated lists with filters, product management, categories, platform settings, analytics (best sellers, category performance, CLV, seasonal trends, revenue forecast, seasonal planner).

### `tests/admin/actions.test.ts` — Admin Actions (73 tests)

Covers all admin server actions: application approve/reject, customer toggles (Net30, tax exempt, discount, notes, reengagement), order management (batch status, tracking, delivery, refunds, cancellation), product CRUD (create, update, availability, badges, featured, sort, batch), category CRUD, invoice actions (pay, void, credit), settings, manual orders. Includes auth guard verification for all actions.

### `tests/admin/emails.test.ts` — Admin Emails (10 tests)

| Test | What it verifies |
| ---- | ---------------- |
| sendNewOrderNotification | Sends with correct subject/to, skips when email empty/null, formats cents, includes business name |
| sendLowActivityDigest | Sends with customer count, lists at-risk customers, skips when empty |

### `tests/customer/cart.test.ts` — Cart Actions (16 tests)

| Test | What it verifies |
| ---- | ---------------- |
| addToCart | Auth check, product validation (not found, unavailable, no box option), quantity increment validation, new item insert, existing item quantity update |
| updateCartQuantity | Auth check, item not found, invalid increment, zero deletes, valid update |
| removeFromCart | Auth check, delete and revalidate |
| getCartWithItems | Auth check (returns null), full cart with calculated totals (subtotal, discount, shipping, minimum, isReturning) |

### `tests/customer/wishlist.test.ts` — Wishlist Actions (10 tests)

| Test | What it verifies |
| ---- | ---------------- |
| toggleWishlist | Auth check, adds new item, removes existing item |
| removeFromWishlist | Auth check, removes and revalidates |
| moveToCart | Auth check, item not found, product unavailable, adds to cart + removes from wishlist, skips if already in cart |

### `tests/customer/auth.test.ts` — Customer Auth Actions (12 tests)

| Test | What it verifies |
| ---- | ---------------- |
| loginAction | Invalid form data, valid credentials call signIn, callbackUrl forwarded, AuthError returns user-friendly message, non-AuthError re-thrown |
| requestPasswordResetAction | Invalid email, user found creates token + sends email, user not found still returns success (no enumeration) |
| resetPasswordAction | Invalid form data, used token rejected, expired token rejected, valid token updates password + marks used |

### `tests/customer/account.test.ts` — Account Actions (24 tests)

| Test | What it verifies |
| ---- | ---------------- |
| uploadResaleCertificate | No file, invalid type, file too large, valid upload |
| registerAction | Validation error, duplicate email, success (creates user + address, sends email, redirects) |
| updateProfileAction | Auth check, validation, email conflict, password without current, wrong current password, successful update |
| addAddressAction | Auth check, validation, insert with default handling |
| editAddressAction | Auth check, no addressId, update with revalidation |
| deleteAddressAction | Auth check, last address protection, successful delete |
| setDefaultAddressAction | Auth check, sets default and revalidates |

### `tests/customer/orders.test.ts` — Order Actions (17 tests)

| Test | What it verifies |
| ---- | ---------------- |
| placeOrderAction | Auth, inactive account, Net30 eligibility, empty cart, unavailable items, below minimum, no address, credit card flow (Stripe checkout + redirect), Net30 flow (Stripe invoice + redirect) |
| cancelOrderAction | Auth, not found, shipped rejection, pending cancel with refund, invoice void |
| reorderAction | Auth, not found, adds items to cart and redirects |

### `tests/customer/queries.test.ts` — Customer Queries (15 tests)

| Test | What it verifies |
| ---- | ---------------- |
| getProducts | Returns all, filters by category, empty results |
| getProductBySlug | Found returns product, not found returns null |
| getCategories | Returns sorted, returns empty |
| getPlatformSettings | Returns key-value map, empty when no settings |
| formatCents | Correct formatting ($10.00, $0.50, $0.00, $0.01, $99.99) |
| getCustomerOrders | Returns orders, returns empty |
| getOrderDetail | Returns with items + refunds, null when not found, null when wrong userId |

### `tests/api/webhooks.test.ts` — Stripe Webhook Handler (9 tests)

| Test | What it verifies |
| ---- | ---------------- |
| Missing signature | Returns 400 |
| Invalid signature | Returns 400 |
| checkout.session.completed | Updates order to paid/confirmed |
| No orderId in metadata | No DB changes |
| invoice.paid | Updates order to paid/confirmed |
| invoice.payment_failed | Updates paymentStatus to failed |
| charge.refunded (full) | Marks order as refunded |
| charge.refunded (partial) | Marks order as partially_refunded |
| Unknown event type | Returns received: true, no DB changes |

---

## Test Summary

| Category | Files | Tests |
| -------- | ----- | ----- |
| **Unit — Admin** | 4 | 153 |
| **Unit — Customer** | 5 | 94 |
| **Unit — API** | 1 | 9 |
| **E2E — Public** | 2 | 17 |
| **E2E — Customer** | 8 | 51 |
| **E2E — Admin** | 10 | 95 |
| **Total** | **30** | **419** |
