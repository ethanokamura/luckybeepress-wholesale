import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
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
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 12,
  },
  logo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  dateText: {
    fontSize: 9,
    color: "#888",
    marginTop: 2,
  },
  categoryHeader: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    color: "#333",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  colName: {
    flex: 3,
  },
  colWsp: {
    flex: 1,
    textAlign: "right",
  },
  colSrp: {
    flex: 1,
    textAlign: "right",
  },
  colMin: {
    flex: 1,
    textAlign: "center",
  },
  colSeasonal: {
    flex: 1.5,
    textAlign: "center",
  },
  headerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#666",
  },
  cellText: {
    fontSize: 10,
  },
  cellTextBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  seasonalTag: {
    fontSize: 8,
    color: "#b45309",
    fontFamily: "Helvetica-Oblique",
  },
  boxRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fafafa",
  },
  boxLabel: {
    fontSize: 9,
    color: "#666",
    fontFamily: "Helvetica-Oblique",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#aaa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  noProducts: {
    fontSize: 11,
    color: "#999",
    marginTop: 20,
    textAlign: "center",
  },
});

// ─── Helpers ─────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Types ───────────────────────────────────────────────────

interface LineSheetProduct {
  id: string;
  name: string;
  wholesalePrice: number;
  retailPrice: number;
  minimumOrderQuantity: number;
  seasonalTag: string | null;
  hasBoxOption: boolean;
  boxWholesalePrice: number | null;
  boxRetailPrice: number | null;
  categoryName: string | null;
  categoryId: string;
}

interface CategoryGroup {
  name: string;
  products: LineSheetProduct[];
}

// ─── PDF Document ────────────────────────────────────────────

function LineSheetDocument({
  categoryGroups,
}: {
  categoryGroups: CategoryGroup[];
}) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Lucky Bee Press</Text>
          <Text style={styles.subtitle}>Wholesale Line Sheet</Text>
          <Text style={styles.dateText}>Generated {dateStr}</Text>
        </View>

        {categoryGroups.length === 0 ? (
          <Text style={styles.noProducts}>No products found.</Text>
        ) : (
          categoryGroups.map((group) => (
            <View key={group.name} wrap={false}>
              {/* Category Header */}
              <Text style={styles.categoryHeader}>{group.name}</Text>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colName]}>
                  Product
                </Text>
                <Text style={[styles.headerText, styles.colWsp]}>WSP</Text>
                <Text style={[styles.headerText, styles.colSrp]}>SRP</Text>
                <Text style={[styles.headerText, styles.colMin]}>Min Qty</Text>
                <Text style={[styles.headerText, styles.colSeasonal]}>
                  Season
                </Text>
              </View>

              {/* Product Rows */}
              {group.products.map((product) => (
                <View key={product.id}>
                  <View style={styles.tableRow}>
                    <Text style={[styles.cellTextBold, styles.colName]}>
                      {product.name}
                    </Text>
                    <Text style={[styles.cellText, styles.colWsp]}>
                      {formatCents(product.wholesalePrice)}
                    </Text>
                    <Text style={[styles.cellText, styles.colSrp]}>
                      {formatCents(product.retailPrice)}
                    </Text>
                    <Text style={[styles.cellText, styles.colMin]}>
                      {product.minimumOrderQuantity}
                    </Text>
                    <View style={styles.colSeasonal}>
                      {product.seasonalTag ? (
                        <Text style={styles.seasonalTag}>
                          {product.seasonalTag}
                        </Text>
                      ) : (
                        <Text style={styles.cellText}>{""}</Text>
                      )}
                    </View>
                  </View>

                  {/* Box set sub-row */}
                  {product.hasBoxOption &&
                    product.boxWholesalePrice != null &&
                    product.boxRetailPrice != null && (
                      <View style={styles.boxRow}>
                        <Text style={[styles.boxLabel, styles.colName]}>
                          Box Set (6 cards/box)
                        </Text>
                        <Text style={[styles.boxLabel, styles.colWsp]}>
                          {formatCents(product.boxWholesalePrice)}
                        </Text>
                        <Text style={[styles.boxLabel, styles.colSrp]}>
                          {formatCents(product.boxRetailPrice)}
                        </Text>
                        <Text style={[styles.boxLabel, styles.colMin]}>4</Text>
                        <Text style={[styles.boxLabel, styles.colSeasonal]}>
                          {""}
                        </Text>
                      </View>
                    )}
                </View>
              ))}
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Lucky Bee Press - Wholesale Line Sheet</Text>
          <Text>Prices subject to change</Text>
        </View>
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
  const categoryId = searchParams.get("categoryId");

  // Build where conditions
  const conditions = [eq(products.isAvailable, true)];
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0];

  const finalRows = await db
    .select({
      id: products.id,
      name: products.name,
      wholesalePrice: products.wholesalePrice,
      retailPrice: products.retailPrice,
      minimumOrderQuantity: products.minimumOrderQuantity,
      seasonalTag: products.seasonalTag,
      hasBoxOption: products.hasBoxOption,
      boxWholesalePrice: products.boxWholesalePrice,
      boxRetailPrice: products.boxRetailPrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder));

  // Group by category
  const groupMap = new Map<string, CategoryGroup>();
  for (const row of finalRows) {
    const catName = row.categoryName ?? "Uncategorized";
    if (!groupMap.has(catName)) {
      groupMap.set(catName, { name: catName, products: [] });
    }
    groupMap.get(catName)!.products.push(row);
  }
  const categoryGroups = Array.from(groupMap.values());

  const buffer = await ReactPDF.renderToBuffer(
    <LineSheetDocument categoryGroups={categoryGroups} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="line-sheet-${Date.now()}.pdf"`,
    },
  });
}
