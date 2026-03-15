import { describe, it, expect, vi, beforeEach } from "vitest";

// Un-mock the module under test; keep all other mocks from setup.ts
vi.unmock("@/lib/admin/emails");

import { mockDb } from "../setup";
import { resend } from "@/lib/email";
import {
  sendNewOrderNotification,
  sendLowActivityDigest,
} from "@/lib/admin/emails";

// ─── Helpers ────────────────────────────────────────────────

function mockAdminEmail(email: string | null) {
  // getAdminNotificationEmail does:
  //   db.select({ value: ... }).from(...).where(...).limit(1)
  // The chainable mock resolves via `.then`. We override select to
  // return a chain that resolves with the appropriate row.
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "from",
    "where",
    "leftJoin",
    "innerJoin",
    "orderBy",
    "limit",
    "offset",
    "groupBy",
    "having",
    "insert",
    "values",
    "update",
    "set",
    "delete",
    "returning",
    "onConflictDoUpdate",
    "onConflictDoNothing",
    "as",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  const resolved = email ? [{ value: email }] : [];
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve(resolved).then(resolve);

  mockDb.select.mockReturnValue(chain as never);
}

function makeOrder(overrides = {}) {
  return {
    id: "order-uuid-1",
    orderNumber: "WO-1001",
    total: 15000, // $150.00
    paymentMethod: "net_30",
    items: [{ id: "item-1" }, { id: "item-2" }],
    ...overrides,
  };
}

function makeCustomer(overrides = {}) {
  return {
    businessName: "Acme Cards",
    ownerName: "Jane Doe",
    ...overrides,
  };
}

function makeAtRiskCustomer(overrides = {}) {
  return {
    businessName: "Sleepy Shop",
    ownerName: "John Smith",
    email: "john@sleepyshop.com",
    lastOrderDate: new Date("2025-06-01"),
    daysSinceLastOrder: 45,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendNewOrderNotification", () => {
  it("sends email with correct subject and to address from platform_settings", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    await sendNewOrderNotification(makeOrder(), makeCustomer());

    expect(resend.emails.send).toHaveBeenCalledOnce();
    const call = vi.mocked(resend.emails.send).mock.calls[0][0];
    expect(call.to).toBe("admin@luckybeepress.com");
    expect(call.subject).toBe("New Order: WO-1001");
  });

  it("skips sending if admin_notification_email is empty", async () => {
    mockAdminEmail("");

    await sendNewOrderNotification(makeOrder(), makeCustomer());

    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("skips sending if admin_notification_email is null (not in db)", async () => {
    mockAdminEmail(null);

    await sendNewOrderNotification(makeOrder(), makeCustomer());

    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("formats order total from cents to dollars correctly", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    await sendNewOrderNotification(
      makeOrder({ total: 9999 }),
      makeCustomer(),
    );

    const html = vi.mocked(resend.emails.send).mock.calls[0][0].html as string;
    expect(html).toContain("$99.99");
  });

  it("includes customer business name in body and order number in subject", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    await sendNewOrderNotification(
      makeOrder({ orderNumber: "WO-2002" }),
      makeCustomer({ businessName: "Sunshine Cards" }),
    );

    const call = vi.mocked(resend.emails.send).mock.calls[0][0];
    const html = call.html as string;
    expect(html).toContain("Sunshine Cards");
    expect(call.subject).toContain("WO-2002");
  });
});

describe("sendLowActivityDigest", () => {
  it("sends email with customer count in subject", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    const customers = [
      makeAtRiskCustomer(),
      makeAtRiskCustomer({ businessName: "Other Shop", email: "o@o.com" }),
    ];

    await sendLowActivityDigest(customers);

    expect(resend.emails.send).toHaveBeenCalledOnce();
    const call = vi.mocked(resend.emails.send).mock.calls[0][0];
    expect(call.subject).toContain("2 At-Risk Customers");
  });

  it("lists all at-risk customers in the body", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    const customers = [
      makeAtRiskCustomer({ businessName: "Shop A", email: "a@a.com" }),
      makeAtRiskCustomer({ businessName: "Shop B", email: "b@b.com" }),
      makeAtRiskCustomer({ businessName: "Shop C", email: "c@c.com" }),
    ];

    await sendLowActivityDigest(customers);

    const html = vi.mocked(resend.emails.send).mock.calls[0][0].html as string;
    expect(html).toContain("Shop A");
    expect(html).toContain("Shop B");
    expect(html).toContain("Shop C");
    expect(html).toContain("a@a.com");
    expect(html).toContain("b@b.com");
    expect(html).toContain("c@c.com");
  });

  it("skips sending if no customers provided (empty array)", async () => {
    mockAdminEmail("admin@luckybeepress.com");

    await sendLowActivityDigest([]);

    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("skips sending if admin_notification_email is empty", async () => {
    mockAdminEmail("");

    await sendLowActivityDigest([makeAtRiskCustomer()]);

    expect(resend.emails.send).not.toHaveBeenCalled();
  });
});
