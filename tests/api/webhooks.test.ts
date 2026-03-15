import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "../setup";

// ─── Override Stripe mock to include webhooks ───────────────────
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    refunds: { create: vi.fn() },
    invoices: { pay: vi.fn(), voidInvoice: vi.fn(), list: vi.fn() },
    creditNotes: { create: vi.fn() },
  },
}));

// ─── Mock next/server ───────────────────────────────────────────
vi.mock("next/server", () => {
  return {
    NextRequest: class MockNextRequest extends Request {
      nextUrl: URL;
      constructor(input: string | URL, init?: RequestInit) {
        super(input, init);
        this.nextUrl = new URL(typeof input === "string" ? input : input.toString());
      }
    },
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) => {
        return new Response(JSON.stringify(data), {
          status: init?.status ?? 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  };
});

// ─── Helpers ────────────────────────────────────────────────────

function chain(data: unknown = []) {
  const c: Record<string, unknown> = {};
  const methods = [
    "select", "from", "where", "leftJoin", "innerJoin", "orderBy",
    "limit", "offset", "groupBy", "having", "insert", "values",
    "update", "set", "delete", "returning", "onConflictDoUpdate",
    "onConflictDoNothing", "as",
  ];
  for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
  c.then = (resolve: (v: unknown) => void) => Promise.resolve(data).then(resolve);
  return c;
}

function mockUpdate(data: unknown = []) {
  mockDb.update.mockReturnValueOnce(chain(data) as ReturnType<typeof mockDb.update>);
}

// ─── Mock imports ───────────────────────────────────────────────

import { stripe } from "@/lib/stripe";

// ─── SUT ────────────────────────────────────────────────────────

import { POST } from "@/app/api/webhooks/stripe/route";

// ─── Fixture helpers ────────────────────────────────────────────

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

function makeStripeEvent(type: string, dataObject: unknown) {
  return { type, data: { object: dataObject } };
}

// ─── Reset ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// Signature validation
// ═══════════════════════════════════════════════════════════════

describe("signature validation", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const req = makeRequest("raw-body");
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "Missing signature" });
  });

  it("returns 400 when signature is invalid", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });

    const req = makeRequest("raw-body", { "stripe-signature": "sig_bad" });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: "Invalid signature" });
  });
});

// ═══════════════════════════════════════════════════════════════
// checkout.session.completed
// ═══════════════════════════════════════════════════════════════

describe("checkout.session.completed", () => {
  it("updates order to paid/confirmed", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      metadata: { orderId: "order-1" },
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);
    mockUpdate();

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("does nothing when metadata has no orderId", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      metadata: {},
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// invoice.paid
// ═══════════════════════════════════════════════════════════════

describe("invoice.paid", () => {
  it("updates order to paid/confirmed", async () => {
    const event = makeStripeEvent("invoice.paid", {
      metadata: { orderId: "order-2" },
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);
    mockUpdate();

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// invoice.payment_failed
// ═══════════════════════════════════════════════════════════════

describe("invoice.payment_failed", () => {
  it("updates order paymentStatus to failed", async () => {
    const event = makeStripeEvent("invoice.payment_failed", {
      metadata: { orderId: "order-3" },
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);
    mockUpdate();

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// charge.refunded
// ═══════════════════════════════════════════════════════════════

describe("charge.refunded", () => {
  it("marks order as refunded when fully refunded", async () => {
    const event = makeStripeEvent("charge.refunded", {
      payment_intent: "pi_test",
      amount: 5000,
      amount_refunded: 5000,
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);
    mockUpdate();

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("marks order as partially_refunded when partially refunded", async () => {
    const event = makeStripeEvent("charge.refunded", {
      payment_intent: "pi_test",
      amount: 5000,
      amount_refunded: 2000,
    });
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);
    mockUpdate();

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// Unknown event type
// ═══════════════════════════════════════════════════════════════

describe("unknown event type", () => {
  it("returns received: true without DB changes", async () => {
    const event = makeStripeEvent("some.unknown.event", {});
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(event as never);

    const req = makeRequest("raw-body", { "stripe-signature": "sig_test" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.delete).not.toHaveBeenCalled();
  });
});
