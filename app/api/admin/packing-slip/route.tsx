import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getAdminOrderDetail } from "@/lib/admin/queries";
import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 16,
  },
  logo: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 8,
    color: "#888",
    marginTop: 2,
  },
  orderInfo: {
    textAlign: "right",
  },
  orderNumber: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  orderDate: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#666",
    marginBottom: 6,
  },
  addressBlock: {
    marginBottom: 24,
  },
  addressLine: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  colProduct: {
    flex: 3,
  },
  colType: {
    flex: 1,
    textAlign: "center",
  },
  colQty: {
    flex: 1,
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#666",
  },
  cellText: {
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
});

// ─── PDF Document ────────────────────────────────────────────

interface PackingSlipOrder {
  orderNumber: string;
  createdAt: Date;
  shippingAddressSnapshot: {
    recipientName: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  customerBusinessName: string | null;
  items: {
    id: string;
    productName: string;
    lineItemType: string;
    quantity: number;
  }[];
}

function PackingSlipDocument({ order }: { order: PackingSlipOrder }) {
  const addr = order.shippingAddressSnapshot;
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Lucky Bee Press</Text>
            <Text style={styles.tagline}>Wholesale Packing Slip</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
        </View>

        {/* Ship To */}
        <View style={styles.addressBlock}>
          <Text style={styles.sectionTitle}>Ship To</Text>
          {addr ? (
            <>
              <Text style={styles.addressLine}>{addr.recipientName}</Text>
              {order.customerBusinessName && (
                <Text style={styles.addressLine}>
                  {order.customerBusinessName}
                </Text>
              )}
              <Text style={styles.addressLine}>{addr.street1}</Text>
              {addr.street2 && (
                <Text style={styles.addressLine}>{addr.street2}</Text>
              )}
              <Text style={styles.addressLine}>
                {addr.city}, {addr.state} {addr.zip}
              </Text>
              {addr.country && addr.country !== "US" && (
                <Text style={styles.addressLine}>{addr.country}</Text>
              )}
            </>
          ) : (
            <Text style={styles.addressLine}>No address on file</Text>
          )}
        </View>

        {/* Items Table */}
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colProduct]}>Product</Text>
          <Text style={[styles.headerText, styles.colType]}>Type</Text>
          <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colProduct]}>
              {item.productName}
            </Text>
            <Text style={[styles.cellText, styles.colType]}>
              {item.lineItemType === "box" ? "Box Set" : "Single"}
            </Text>
            <Text style={[styles.cellText, styles.colQty]}>
              {item.quantity}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Lucky Bee Press - Thank you for your order!
        </Text>
      </Page>
    </Document>
  );
}

// ─── Route Handler ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId query parameter is required" },
      { status: 400 },
    );
  }

  const order = await getAdminOrderDetail(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const buffer = await ReactPDF.renderToBuffer(
    <PackingSlipDocument order={order} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packing-slip-${order.orderNumber}.pdf"`,
    },
  });
}
