# Stripe Integration Guide

This app uses Stripe Checkout for secure payment processing.

## Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...

# Stripe Webhook Secret (get from webhook setup)
STRIPE_WEBHOOK_SECRET=whsec_xxx...

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Firebase Admin Setup

1. Go to Firebase Console → Project Settings → Service accounts
2. Click "Generate new private key"
3. Copy the values into your `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## Stripe Webhook Setup

### Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add an endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret to your production environment variables

## How It Works

1. **Checkout Flow**:
   - User adds items to cart
   - User enters shipping/billing addresses
   - User clicks "Proceed to Payment"
   - App creates a Stripe Checkout Session via `/api/stripe/checkout`
   - User is redirected to Stripe's hosted checkout page

2. **After Payment**:
   - Stripe sends a webhook to `/api/stripe/webhook`
   - The webhook handler creates an order in Firebase
   - The user's cart is cleared
   - User is redirected to `/checkout/success`

3. **Order Management**:
   - Orders are stored in Firestore with payment status
   - Admin can view/manage orders from the admin panel

## File Structure

```
app/
├── api/
│   └── stripe/
│       ├── checkout/
│       │   └── route.ts       # Creates Stripe checkout sessions
│       └── webhook/
│           └── route.ts       # Handles Stripe webhooks
├── (dashboard)/
│   └── checkout/
│       ├── page.tsx           # Checkout page with address forms
│       └── success/
│           └── page.tsx       # Success page after payment
lib/
└── stripe.ts                  # Stripe configuration
```

## Testing

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Use any future expiration date and any 3-digit CVC.

## Going Live

1. Complete Stripe account activation
2. Replace test keys with live keys in production
3. Update webhook endpoint to production URL
4. Test the full flow with a real card (refund immediately)


wholesale.luckybeepress.com/api/stripe/webhook