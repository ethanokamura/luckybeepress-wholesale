import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Order } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  logoSubtext: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  section: {},
  sectionTitle: {
    marginTop: 2,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addressBlock: {
    width: "48%",
    flexDirection: "row",
    gap: 10,
  },
  addressName: {
    fontSize: 11,
    fontFamily: "Helvetica",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    color: "#444",
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
    fontSize: 10,
    color: "#666",
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colImage: {
    width: "10%",
    paddingRight: 8,
  },
  productImage: {
    width: 40,
    height: 40,
    objectFit: "cover",
    borderRadius: 4,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  colSku: {
    width: "10%",
    fontSize: 9,
  },
  colItem: {
    width: "34%",
  },
  colQty: {
    width: "10%",
    textAlign: "center",
  },
  colPrice: {
    width: "18%",
    textAlign: "right",
  },
  colTotal: {
    width: "18%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#666",
    textTransform: "uppercase",
  },
  itemName: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  itemSku: {
    fontSize: 9,
    color: "#666",
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 20,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  totalsLabel: {
    width: 120,
    fontSize: 10,
    color: "#666",
    textAlign: "right",
    paddingRight: 20,
  },
  totalsValue: {
    width: 100,
    fontSize: 10,
    textAlign: "right",
  },
  totalsFinal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalsFinalLabel: {
    width: 120,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    paddingRight: 20,
  },
  totalsFinalValue: {
    width: 100,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  thankYou: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#f5a623",
    marginBottom: 4,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.4,
  },
});

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface InvoiceTemplateProps {
  order: Order;
  orderDate: Date | null;
}

export function InvoiceTemplate({ order, orderDate }: InvoiceTemplateProps) {
  const itemSubtotals = order.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Lucky Bee Press</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={[styles.section, styles.row]}>
          <View style={[styles.addressBlock]}>
            <Text style={styles.sectionTitle}>Ship To</Text>
            <View>
              <Text style={styles.addressName}>
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
              </Text>
              {order.shippingAddress.company && (
                <Text style={styles.companyName}>
                  {order.shippingAddress.company}
                </Text>
              )}
              <Text style={styles.addressText}>
                {order.shippingAddress.street1}
              </Text>
              {order.shippingAddress.street2 && (
                <Text style={styles.addressText}>
                  {order.shippingAddress.street2}
                </Text>
              )}
              <Text style={styles.addressText}>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </Text>
              <Text style={styles.addressText}>
                {order.shippingAddress.country}
              </Text>
              {order.shippingAddress.phone && (
                <Text style={styles.addressText}>
                  Tel: {order.shippingAddress.phone}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ORDER NO:</Text>
              <Text style={styles.infoValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ORDER DATE:</Text>
              <Text style={styles.infoValue}>{formatDate(orderDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PAYMENT STATUS:</Text>
              <Text style={styles.infoValue}>
                {order.paymentStatus.charAt(0).toUpperCase() +
                  order.paymentStatus.slice(1)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ORDER STATUS:</Text>
              <Text style={styles.infoValue}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colImage}>
              <Text style={styles.tableHeaderText}></Text>
            </View>
            <View style={styles.colSku}>
              <Text style={styles.tableHeaderText}>SKU</Text>
            </View>
            <View style={styles.colItem}>
              <Text style={styles.tableHeaderText}>Item</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.tableHeaderText}>Unit Price</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tableHeaderText}>Subtotal</Text>
            </View>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={[styles.tableRow]}>
              <View style={styles.colImage}>
                {item.image && (
                  /* eslint-disable-next-line jsx-a11y/alt-text */
                  <Image src={item.image} style={styles.productImage} />
                )}
                {!item.image && <View style={styles.imagePlaceholder} />}
              </View>
              <View style={styles.colSku}>
                <Text style={styles.itemSku}>{item.sku || "-"}</Text>
              </View>
              <View style={styles.colItem}>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.colQty}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text>{formatPrice(item.total)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
