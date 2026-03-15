# E2E Test Coverage: Flows & Edge Cases

202 end-to-end tests across 21 test files, covering the entire Lucky Bee Press wholesale storefront.

---

## Public Pages (17 tests)

### Page Rendering
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Homepage loads | Hero section, "Browse Catalog" CTA, "Apply" CTA all visible | public-pages |
| Homepage brand story | Founder name (Laurie) and Lucky Bee Press branding display | public-pages |
| Wholesale info page | Program heading, pricing ($3.00/$11.00), apply CTA visible | public-pages |
| Contact page | "Contact Us" heading and email address render | public-pages |
| Privacy policy | Page heading renders | public-pages |
| Terms of service | Page heading renders (multiple headings with "terms" handled) | public-pages |
| Forgot password page | Heading and email input visible | public-pages |
| Apply confirmation | Thank you / submitted message shown after application | public-pages-extended |
| Reset password page | Page loads without a token | public-pages-extended |

### Navigation
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Header nav links | Wholesale Program and Apply links navigate correctly | public-pages |
| Footer links | Contact, Privacy, Terms footer links all navigate correctly | public-pages |

### Forms & Auth Boundary
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Apply form loads | Business name, email, password fields and submit button present | public-pages |
| Apply form validation | Empty form submission blocked by HTML5 validation | public-pages |
| Apply form submission | Full form filled and submitted with valid data | public-pages-extended |
| Approval pending redirect | Unauthenticated visit to /approval-pending redirects to login | public-pages-extended |
| Reset password with invalid token | Page handles invalid/missing token gracefully | public-pages-extended |
| Forgot password submission | Email submitted, success message shown (no enumeration) | public-pages-extended |

---

## Customer Authentication (11 tests)

### Route Protection
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| /catalog redirect | Unauthenticated user redirected to /login | customer-auth |
| /cart redirect | Unauthenticated user redirected to /login | customer-auth |
| /orders redirect | Unauthenticated user redirected to /login | customer-auth |
| /account redirect | Unauthenticated user redirected to /login | customer-auth |
| /wishlist redirect | Unauthenticated user redirected to /login | customer-auth |

### Login Flow
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Invalid credentials | Error message "Invalid email or password" displayed | customer-auth |
| Empty password | HTML5 required attribute blocks form submission | customer-auth |
| Valid login | Login succeeds, user navigated away from /login | customer-auth |
| Callback URL preserved | Redirect to original page after login (e.g. /orders → login → /orders) | customer-auth |
| Forgot password link | Link present on login page, navigates to /forgot-password | customer-auth |
| Apply link | "Apply for wholesale access" link present on login page | customer-auth |

---

## Customer Account Management (10 tests)

### Profile
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Account page loads | "Account Settings" heading, profile section visible | customer-account |
| Profile form fields | Name, email, phone fields and Save Changes button present | customer-account |
| Profile name editable | Name field has a current value and is editable | customer-account-extended |
| Save button present | Save/update profile button visible | customer-account-extended |

### Password
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Password change section | "Change Password" heading, current and new password fields | customer-account |
| Current password required | Both current and new password inputs must be present | customer-account-extended |

### Shipping Addresses
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Addresses section visible | "Shipping Addresses" heading displayed | customer-account |
| View existing addresses | Address list or section visible | customer-account-extended |
| Add address form | Clicking "Add Address" shows Recipient, Street, City, State, ZIP fields | customer-account, customer-account-extended |
| Address fields rendered | Form labels use text (not HTML label tags) — tests use getByText | customer-account-extended |

---

## Product Catalog (9 tests)

### Browsing
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Catalog loads | Heading and at least one product card visible | customer-catalog |
| Product cards content | Each card shows product name, price, and image | customer-catalog |
| Product detail page | Full info: WSP pricing, add-to-cart or unavailable state | customer-catalog |
| Multiple product images | Image gallery renders on product detail | customer-catalog |

### Search & Filters
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Search by name | Typing product name filters the catalog | customer-catalog |
| Search by SKU | Typing SKU filters the catalog | customer-catalog |
| Empty search results | Gibberish search shows "no results" message | customer-catalog |
| Category filter | Selecting a category filters the product list | customer-catalog |
| Clear filters | Clearing filters restores the full product list | customer-catalog |

---

## Cart & Checkout (12 tests)

### Cart State
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Empty cart | Empty state message with "browse" link displayed | customer-cart-checkout |
| Add product to cart | "Add to Cart" from product detail page works, success message | customer-cart-checkout |
| Cart shows items | Subtotal, shipping ($15), and total displayed | customer-cart-checkout |
| Minimum order warning | Warning shown when cart total below the order minimum | customer-cart-checkout |
| Shipping cost | Flat-rate $15.00 shipping displayed | customer-cart-checkout |

### Cart Actions
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Quantity increment rules | Quantity controls enforce min/max/step limits | customer-cart-checkout |
| Update quantity | Changing quantity in cart updates correctly | customer-cart-checkout |
| Remove item | Removing an item from cart works | customer-cart-checkout |

### Checkout Form
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Payment method | Credit card / Net 30 selector present | customer-cart-checkout |
| Address selector | Shipping address dropdown present | customer-cart-checkout |
| Order notes | Notes textarea present | customer-cart-checkout |
| Place order button | Button visible when cart meets minimum threshold | customer-cart-checkout |

---

## Order Management (8 tests)

### Order List
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Orders page loads | Heading visible | customer-orders |
| Empty or populated | Shows "no orders" or order list depending on data | customer-orders |
| Order items display | Each order shows order number, date, status, total | customer-orders |
| Navigate to detail | Clicking an order navigates to /orders/[id] | customer-orders |

### Order Detail
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Status badge | Order status (pending, shipped, etc.) badge displayed | customer-orders |
| Reorder button | Present on order detail page | customer-orders |
| Invoice download | Download button/link present | customer-orders |
| Cancel button | Shown only for pending/confirmed orders | customer-orders |

---

## Wishlist (4 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Wishlist loads | Heading visible | customer-wishlist |
| Empty state | Empty wishlist message when no items saved | customer-wishlist |
| Add from product detail | "Add to Wishlist" button works on product detail page | customer-wishlist |
| Item info displayed | Saved items show product info | customer-wishlist |

---

## Full Customer Flows (9 tests)

### Happy Path Journeys
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Browse → add → cart → verify | Log in, browse catalog, view product, add to cart, verify summary | customer-full-flow |
| Multiple products to minimum | Add several products with increased quantities to meet order minimum | customer-full-flow |
| Reorder flow | Click reorder on existing order, cart pre-populated | customer-full-flow |

### Cross-Feature Flows
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Wishlist → cart | Add to wishlist from product detail, then move to cart | customer-flows-extended |
| Order cancellation | Cancel button visibility on eligible orders | customer-flows-extended |
| Invoice download | Invoice link/button exists on order detail | customer-flows-extended |
| Discount in cart | Cart shows discount line if customer has custom discount | customer-flows-extended |
| Session logout | Logout redirects to login, protected pages inaccessible | customer-flows-extended |
| Product image gallery | Multiple images display on product detail | customer-flows-extended |

---

## Admin Authentication (7 tests)

### Route Protection
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| /admin redirect | Unauthenticated → /login | admin-auth |
| /admin/orders redirect | Unauthenticated → /login | admin-auth |
| /admin/customers redirect | Unauthenticated → /login | admin-auth |
| /admin/products redirect | Unauthenticated → /login | admin-auth |
| /admin/settings redirect | Unauthenticated → /login | admin-auth |

### Login Page
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Login form renders | Email and password fields visible | admin-auth |
| Sign-in description | Description text displayed | admin-auth |

---

## Admin Dashboard (17 tests)

### KPI Widgets
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Dashboard loads | Heading visible | admin-dashboard |
| Pending applications widget | Count visible | admin-dashboard |
| New orders widget | Count visible | admin-dashboard |
| Overdue invoices widget | Count visible | admin-dashboard |
| At-risk customers widget | Count visible | admin-dashboard |
| 30-day summary | Orders, Revenue, New Accounts metrics visible | admin-dashboard |
| Applications widget deep link | Links to /admin/applications | admin-dashboard |
| Orders widget deep link | Links to /admin/orders | admin-dashboard |

### Sidebar Navigation
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| All nav links present | Applications, Customers, Orders, Products, Settings, Analytics | admin-dashboard |
| Admin branding | Lucky Bee Press branding in sidebar | admin-dashboard |
| Signed-in user info | User name/email displayed | admin-dashboard |
| Each nav link works | 6 sidebar links navigate correctly (Applications through Analytics) | admin-dashboard |

---

## Admin Applications (8 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Application Queue" heading visible | admin-applications |
| Back to dashboard | Link present and navigates to /admin | admin-applications |
| Table or empty state | Either populated table or empty message displays | admin-applications |
| Column headers | Business Name, Owner, Email, Business Type, Submitted | admin-applications |
| Empty state message | Descriptive "No pending applications" message | admin-applications |
| Navigate to detail | Click application → detail page loads | admin-extended |
| Approve/reject buttons | Both action buttons present on detail page | admin-extended |
| Back navigation | Returns to /admin | admin-applications |

---

## Admin Customer Management (10 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Customers" heading visible | admin-customers |
| Search input | Search field visible and functional | admin-customers |
| Status filter | Dropdown with correct status options | admin-customers |
| Filter button | Button visible | admin-customers |
| Table or empty state | Table renders with data or empty state shown (waits for content) | admin-customers |
| Column headers | Business Name, Owner, Email, Status, Net 30, Discount, Joined | admin-customers |
| Customer detail nav | Clicking customer navigates to /admin/customers/[id] | admin-customers |
| Back to dashboard | Link navigates to /admin | admin-customers |
| Filter submission | URL updates with search params | admin-customers |
| Detail page actions | Net30, tax exempt, discount controls visible on detail page | admin-extended |

---

## Admin Order Management (18 tests)

### Order List
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Orders" heading visible | admin-orders |
| Status filter | Dropdown with correct status options | admin-orders |
| Payment method filter | Dropdown with payment method options | admin-orders |
| Date range inputs | From/To date inputs present | admin-orders |
| Search input | Order # / customer search field | admin-orders |
| Filter/reset buttons | Both buttons visible | admin-orders |
| Create order link | Navigates to /admin/orders/create | admin-orders |
| Filter submission | URL updates with params | admin-orders |
| Status filter label | Filter label visible (uses `<label>` locator to avoid strict mode) | admin-orders |
| Payment filter label | Filter label visible | admin-orders |

### Order Detail
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Management controls | Status, tracking, payment info visible | admin-extended |
| Tracking field | Order detail shows tracking-related info | admin-extended |

### Create Order Form
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Create Order" heading | admin-orders |
| Customer dropdown | Customer selector present | admin-orders |
| Product search | Product search input present | admin-orders |
| Payment method | Payment selector present | admin-orders |
| Notes | Textarea present | admin-orders |
| Totals | Subtotal, Shipping (flat), Total displayed | admin-orders |

---

## Admin Product Management (16 tests)

### Product List
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Products" heading visible | admin-products |
| New product link | Link exists, navigates to /admin/products/new | admin-products |
| Export line sheet | Export button visible | admin-products |

### New Product Form
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "New Product" heading | admin-products |
| Name field | Required, present | admin-products |
| SKU field | Present | admin-products |
| Category dropdown | Required, present | admin-products |
| Wholesale price | Field present | admin-products |
| Retail price | Field present | admin-products |
| Description | Textarea present | admin-products |
| Image URLs | 4 image URL inputs present | admin-products |
| Checkboxes | At least one checkbox (Available, Best Seller, etc.) present | admin-products |
| Toggle checkboxes | Available, Best Seller, New Arrival, Featured toggles | admin-products |
| Seasonal fields | Seasonal tag and order-by-date fields present | admin-products |
| Submit button | "Create Product" button present | admin-products |

### Edit Product
| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Navigate to edit | Click edit link → /admin/products/[id]/edit loads | admin-extended |
| Form fields populated | "Edit Product" heading and Name field visible | admin-extended |

---

## Admin Category Management (9 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Categories" heading visible | admin-categories |
| Create input | Text input for new category name | admin-categories |
| Add button | Button exists | admin-categories |
| Button disabled when empty | Disabled state when input is blank | admin-categories |
| Button enabled with text | Enabled when text entered | admin-categories |
| List or empty state | Categories render or "No categories yet." shown (waits for skeleton) | admin-categories |
| Product counts | Each category shows product count (waits for data load) | admin-categories |
| Rename/delete actions | Action buttons present on each category | admin-categories |
| Reorder buttons | Drag/reorder controls present | admin-categories |

---

## Admin Settings (15 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | "Settings" heading visible | admin-settings |
| Back to dashboard | Link visible, navigates to /admin | admin-settings |
| Shipping rate | Field exists | admin-settings |
| New customer minimum | Field exists | admin-settings |
| Returning customer minimum | Field exists | admin-settings |
| Featured limit | Field exists | admin-settings |
| At-risk threshold | Field exists | admin-settings |
| Reorder email delay | Field exists | admin-settings |
| Net 30 threshold | Field exists | admin-settings |
| Admin notification email | Field exists | admin-settings |
| Save button | Save button visible | admin-settings |
| Field descriptions | Each field has description text | admin-settings |
| Fields accept input | Fields are editable | admin-settings |
| Settings save | Clicking save shows success feedback | admin-extended |
| Back to dashboard nav | Returns to /admin | admin-settings |

---

## Admin Analytics (16 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Page loads | Heading visible | admin-analytics |
| Revenue forecast | Section visible with projection cards and customer metrics | admin-analytics |
| Best sellers | Section visible, table has correct headers | admin-analytics |
| Category performance | Section visible, table headers use `columnheader` role (avoids strict mode) | admin-analytics |
| Customer lifetime value | Section visible, table has correct headers | admin-analytics |
| At-risk customers | Section visible, table has correct headers | admin-analytics |
| Seasonal trends | Section visible | admin-analytics |
| Platform settings | Section visible, table has correct headers | admin-analytics |
| All sections render | No errors across all report sections | admin-analytics |

---

## Admin Invoices & Manual Orders (4 tests)

| Flow | Edge Case | File |
| ---- | --------- | ---- |
| Invoices page loads | Heading visible | admin-extended |
| Table or empty state | Either invoice table or empty message (uses `.or()` locator) | admin-extended |
| Create order form | All required fields present (customer, products, payment, notes) | admin-extended |
| Create order button | Submit button visible | admin-extended |

---

## Edge Cases & Patterns Covered

### Authentication Edge Cases
- Redirect preservation via `callbackUrl` query parameter
- Session persistence across page reloads
- Logout → protected route redirect
- Invalid credentials error messaging
- HTML5 validation for empty required fields
- Email enumeration prevention (forgot password always returns success)

### Data Loading Edge Cases
- Skeleton/loading state handling (tests wait for content with timeouts)
- Empty state vs populated state (tables, lists, orders, wishlist)
- Concurrent `.or()` locators for either/or states

### Strict Mode Handling
- Multiple elements matching same text (`.first()` or role-based selectors)
- Labels as text vs `<label>` elements (`getByText` vs `getByLabel`)
- Column headers vs section headers (`getByRole("columnheader")`)

### Business Logic Edge Cases
- Minimum order threshold enforcement
- Quantity increment rules (multiples of 6 for singles, 4 for box sets)
- Returning customer vs new customer pricing thresholds
- Custom discount visibility in cart
- Net 30 payment eligibility
- Order cancellation only for pending/confirmed status
- Reorder flow pre-populates cart from previous order
- Wishlist → cart transfer

### Cross-Browser & Environment
- All tests run in Chromium (Desktop Chrome)
- Dev server started with `--webpack` flag (avoids Turbopack CSS corruption)
- Admin login timeout set to 30s for slow webpack compilation
- `server-only` guard on `lib/db` prevents client-side DB imports
