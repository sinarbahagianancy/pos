import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  pageA5: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  pageA4: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  spacer: {
    flex: 1,
  },
  invoiceContainer: {
    width: 420,
    height: 595,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    objectFit: "contain",
  },
  storeInfo: {
    marginLeft: 10,
  },
  storeName: {
    fontSize: 14,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  storeTagline: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  storeAddress: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 1,
  },
  invoiceInfo: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 7,
    fontWeight: 800,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  invoiceId: {
    fontSize: 12,
    fontWeight: 900,
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 12,
  },
  customerLeft: {
    flex: 1,
  },
  customerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  sectionLabel: {
    fontSize: 6,
    fontWeight: 800,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  customerDetail: {
    fontSize: 8,
    color: "#475569",
    marginTop: 1,
  },
  customerNpwp: {
    fontSize: 9,
    fontWeight: 800,
    fontFamily: "Courier",
  },
  noNpwp: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#94a3b8",
  },
  paymentBadge: {
    marginTop: 12,
    padding: "3 8",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  paymentText: {
    fontSize: 8,
    fontWeight: 800,
    textTransform: "uppercase",
    color: "#4f46e5",
  },
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
  },
  tableHeaderText: {
    fontSize: 6,
    fontWeight: 800,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  col1: { width: "65%" },
  col3: { width: "35%", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowText: {
    fontSize: 9,
  },
  itemModel: {
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  itemSn: {
    fontSize: 7,
    fontFamily: "Courier",
    color: "#6366f1",
    marginTop: 2,
    textTransform: "uppercase",
  },
  warrantyBox: {
    alignItems: "center",
  },
  warrantyLabel: {
    fontSize: 5,
    padding: "2 4",
    backgroundColor: "#f8fafc",
    borderRadius: 3,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  warrantyDate: {
    fontSize: 7,
    fontWeight: 700,
    marginTop: 2,
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 8,
  },
  footerSection: {
    flex: 1,
  },
  disclaimer: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    fontStyle: "italic",
    maxWidth: 180,
  },
  totals: {
    width: 120,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 8,
    fontWeight: 700,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#0f172a",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: -0.5,
    textAlign: "right",
  },
});

interface InvoiceItem {
  merk?: string;
  model: string;
  sn: string;
  price: number;
  warrantyExpiry?: string;
}

interface InvoiceData {
  storeName: string;
  address: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerNpwp?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  taxEnabled?: boolean;
  total: number;
  staffName: string;
  paymentMethod: string;
  notes?: string;
  isQuotation?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export type InvoiceLayout = "a5" | "a4";

export const InvoiceDocument: React.FC<{ data: InvoiceData; layout?: InvoiceLayout }> = ({
  data,
  layout = "a5",
}) => {
  const isQuotation = data.isQuotation || false;
  const isA4 = layout === "a4";

  // Fake PPN: when taxEnabled is false, the DB records tax=0 but the PDF
  // should still show 11% PPN. Back-calculate from total so:
  //   displaySubtotal + displayTax (11%) = total
  // Compute tax first to guarantee the 11% ratio holds exactly,
  // then derive subtotal as the remainder so they always sum to total.
  // This is purely visual — the DB is unchanged.
  const fakePpnEnabled = data.taxEnabled === false;
  const displayTax = fakePpnEnabled
    ? Math.round(data.total * 0.11 / 1.11)
    : data.tax;
  const displaySubtotal = fakePpnEnabled
    ? data.total - displayTax
    : data.subtotal;
  const displayTaxRate = fakePpnEnabled ? 11 : (data.taxRate || 11);

  const pageContent = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{data.storeName}</Text>
            <Text style={styles.storeTagline}>Cutting Edge Photography</Text>
            <Text style={styles.storeAddress}>{data.address}</Text>
          </View>
        </View>
        <View style={styles.invoiceInfo}>
          <Text style={[styles.invoiceLabel, isQuotation ? { color: "#f97316" } : {}]}>
            {isQuotation ? "Quotation" : "Faktur Penjualan"}
          </Text>
          <Text style={styles.invoiceId}>{data.invoiceNumber}</Text>
          <Text style={styles.invoiceDate}>{data.date}</Text>
          {isQuotation && (
            <View
              style={{
                backgroundColor: "#fef2f2",
                padding: "4 8",
                borderRadius: 4,
                marginTop: 6,
              }}
            >
              <Text style={{ color: "#dc2626", fontSize: 7, fontWeight: 800 }}>
                BUKAN BUKTI PEMBAYARAN
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Customer Section - Hidden for quotations */}
      {!isQuotation && (
        <View style={styles.customerSection}>
          <View style={styles.customerLeft}>
            <Text style={styles.sectionLabel}>Bill To / Penerima</Text>
            <Text style={styles.customerName}>{data.customerName}</Text>
            <Text style={styles.customerDetail}>{data.customerAddress || "-"}</Text>
            <Text style={styles.customerDetail}>Telp: {data.customerPhone || "-"}</Text>
          </View>
          <View style={styles.customerRight}>
            <Text style={styles.sectionLabel}>Tax Registration</Text>
            {data.customerNpwp ? (
              <Text style={styles.customerNpwp}>{data.customerNpwp}</Text>
            ) : (
              <Text style={styles.noNpwp}>No NPWP Provided</Text>
            )}
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>
                {data.paymentMethod === "Credit" ? "UTANG (BON)" : data.paymentMethod}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>
            {isQuotation ? "Description" : "Description / Serial Number"}
          </Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>Total</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.itemModel}>
                {item.merk ? `${item.merk} ` : ""}
                {item.model}
              </Text>
              {!isQuotation && item.sn && <Text style={styles.itemSn}>S/N: {item.sn}</Text>}
            </View>
            <View style={styles.col3}>
              <Text
                style={[styles.tableRowText, { textAlign: "right", fontWeight: 800, fontSize: 11 }]}
              >
                {formatCurrency(item.price)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.footerSection}>
          <Text style={styles.disclaimer}>
            Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.
          </Text>
          {data.notes && (
            <Text
              style={{
                fontSize: 7,
                color: "#475569",
                fontWeight: 700,
                marginTop: 6,
                fontStyle: "italic",
              }}
            >
              Catatan: {data.notes}
            </Text>
          )}
        </View>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(displaySubtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Tax ({displayTaxRate}% PPN)
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(displayTax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            {/* <Text style={styles.grandTotalLabel}>Grand Total</Text> */}
            <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Document>
      {isA4 ? (
        <Page size={[842, 595]} style={styles.pageA4}>
          <View style={styles.spacer} />
          <View style={styles.invoiceContainer}>{pageContent}</View>
        </Page>
      ) : (
        <Page size="A5" style={styles.pageA5}>
          {pageContent}
        </Page>
      )}
    </Document>
  );
};

export default InvoiceDocument;
