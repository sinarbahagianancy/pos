import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";
import { terbilang } from "../utils/terbilang";

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Page
  pageA5Landscape: {
    padding: 12,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.3,
  },
  pageA4Portrait: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.3,
    padding: 0,
  },
  pageA4Landscape: {
    padding: 16,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000000",
    lineHeight: 1.3,
  },

  // A4 Portrait layout (blank top half, invoice on bottom)
  a4PortraitPage: {
    flexDirection: "column",
  },
  a4PortraitTopHalf: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    borderBottomStyle: "dashed",
  },
  a4PortraitBottomHalf: {
    flex: 1,
    padding: 12,
  },

  // ============================================================
  // Header
  // ============================================================
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 6,
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logoColumn: {
    marginRight: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  storeTagline: {
    fontSize: 6,
    fontWeight: "bold",
    marginTop: 4,
    width: 100,
  },
  storeSubTagline: {
    fontSize: 5,
    fontWeight: "bold",
    marginTop: 2,
    width: 100,
  },
  titleColumn: {
    paddingTop: 8,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "nowrap",
  },
  socialIcon: {
    width: 10,
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginRight: 3,
  },
  socialHandle: {
    fontSize: 5,
    marginRight: 8,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  addressLine: {
    fontSize: 6,
    textAlign: "right",
    lineHeight: 1.2,
  },
  phoneLine: {
    fontSize: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 2,
  },
  phoneIcon: {
    width: 6,
    height: 6,
    marginRight: 2,
  },
  phoneText: {
    fontSize: 6,
  },

  // ============================================================
  // Customer + Invoice Details Row
  // ============================================================
  customerInvoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  customerSection: {
    flex: 1,
  },
  invoiceDetailsBox: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
    minWidth: 180,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  invoiceDetailLabel: {
    width: 75,
    fontSize: 7,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  invoiceDetailSeparator: {
    width: 10,
    fontSize: 7,
  },
  invoiceDetailValue: {
    flex: 1,
    fontSize: 7,
    fontWeight: "bold",
  },
  customerLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 2,
  },
  customerName: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  customerNik: {
    fontSize: 7,
    marginTop: 1,
  },
  customerAddress: {
    fontSize: 7,
    marginTop: 1,
  },

  // ============================================================
  // Items Table
  // ============================================================
  table: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#f3f4f6",
  },
  tableHeaderText: {
    fontSize: 6,
    fontWeight: "bold",
    padding: 4,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
  },
  // Column widths: Seria 15%, Nama Barang 35%, Qty 8%, @Harga 18%, Diskon 10%, Total Harga 14%
  colSeria: { width: "15%" },
  colNamaBarang: { width: "35%" },
  colQty: { width: "8%", textAlign: "center" },
  colHarga: { width: "18%", textAlign: "right" },
  colDiskon: { width: "10%", textAlign: "center" },
  colTotalHarga: { width: "14%", textAlign: "right" },

  // ============================================================
  // Terbilang
  // ============================================================
  terbilangSection: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 6,
    marginBottom: 6,
  },
  terbilangLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginRight: 4,
  },
  terbilangValue: {
    fontSize: 7,
    fontWeight: "bold",
    fontStyle: "italic",
  },

  // ============================================================
  // Middle Section: Keterangan + Totals
  // ============================================================
  middleSection: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  keteranganBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
    minHeight: 60,
  },
  keteranganLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 4,
  },
  keteranganContent: {
    fontSize: 7,
    flex: 1,
  },
  totalsBox: {
    width: 160,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 7,
  },
  totalValue: {
    fontSize: 7,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 8,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "right",
  },

  // ============================================================
  // Bottom Section: Pembayaran | Tanda Terima | Perhatian
  // ============================================================
  bottomSection: {
    flexDirection: "row",
    gap: 8,
  },
  // Pembayaran (Payment)
  pembayaranColumn: {
    width: "30%",
  },
  pembayaranLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 2,
  },
  pembayaranValue: {
    fontSize: 7,
    marginBottom: 6,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  bankLogo: {
    width: 12,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 1,
    marginRight: 4,
  },
  bankInfo: {
    fontSize: 6,
  },
  bankHolder: {
    fontSize: 6,
    marginTop: 1,
  },

  // Tanda Terima (Signature)
  tandaTerimaColumn: {
    width: "35%",
  },
  tandaTerimaLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tandaTerimaSpace: {
    height: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
  },

  // Perhatian (Warning)
  perhatianColumn: {
    width: "35%",
  },
  perhatianBox: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
    height: 70,
  },
  perhatianTitle: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 4,
  },
  perhatianText: {
    fontSize: 6,
    lineHeight: 1.3,
  },
});

// ============================================================
// Interfaces
// ============================================================

interface InvoiceItem {
  merk?: string;
  model: string;
  sn: string;
  price: number;
  warrantyExpiry?: string;
}

interface InvoiceData {
  // Store info
  storeName: string;
  address: string;
  storePhone?: string;
  storeTagline?: string;
  storeSubTagline?: string;

  // Social media
  socialYoutube?: string;
  socialInstagram?: string;
  socialTiktok?: string;

  // Invoice info
  invoiceNumber: string;
  date: string;
  poNumber?: string;

  // Customer info
  customerName: string;
  customerAddress?: string;
  customerNpwp?: string;

  // Items
  items: InvoiceItem[];

  // Totals
  subtotal: number;
  tax: number;
  taxRate?: number;
  taxEnabled?: boolean;
  discount?: number;
  total: number;

  // Staff (not displayed)
  staffName: string;

  // Payment
  paymentMethod: string;

  // Notes
  notes?: string;

  // Quotation
  isQuotation?: boolean;
}

export type InvoiceLayout = "a5-landscape" | "a4-portrait" | "a4-landscape";

// ============================================================
// Helpers
// ============================================================

const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPhone = (phone: string): string => {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  // Format: XXXX. XX. XXX. XXX
  if (digits.length >= 12) {
    return `${digits.slice(0, 4)}. ${digits.slice(4, 6)}. ${digits.slice(6, 9)}. ${digits.slice(9, 12)}`;
  }
  return phone;
};

// ============================================================
// Lucide Icons (SVG)
// ============================================================

const MapPinIcon = ({ size = 6, color = "#000000" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </Svg>
);

const PhoneIcon = ({ size = 6, color = "#000000" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

// ============================================================
// Component
// ============================================================

export const InvoiceDocument: React.FC<{ data: InvoiceData; layout?: InvoiceLayout }> = ({
  data,
  layout = "a5-landscape",
}) => {
  const isQuotation = data.isQuotation || false;

  // Fake PPN logic
  const fakePpnEnabled = data.taxEnabled === false;
  const displayTax = fakePpnEnabled ? Math.round((data.total * 0.11) / 1.11) : data.tax;
  const displaySubtotal = fakePpnEnabled ? data.total - displayTax : data.subtotal;
  const displayTaxRate = fakePpnEnabled ? 11 : data.taxRate || 0;
  const displayDiscount = data.discount || 0;

  const pageContent = (
    <>
      {/* ==================== HEADER ==================== */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Logo + Taglines Column */}
          <View style={styles.logoColumn}>
            <Image src="/logo.png" style={styles.logo} />
            {data.storeTagline && <Text style={styles.storeTagline}>{data.storeTagline}</Text>}
            {data.storeSubTagline && (
              <Text style={styles.storeSubTagline}>{data.storeSubTagline}</Text>
            )}
          </View>

          {/* Title + Social Column */}
          <View style={styles.titleColumn}>
            <Text style={styles.invoiceTitle}>
              {isQuotation ? "Quotation" : "Faktur Penjualan"}
            </Text>
            <View style={styles.socialRow}>
              <View style={styles.socialIcon} />
              <View style={styles.socialIcon} />
              <View style={styles.socialIcon} />
              {data.socialYoutube && <Text style={styles.socialHandle}>{data.socialYoutube}</Text>}
              {data.socialInstagram && (
                <Text style={styles.socialHandle}>{data.socialInstagram}</Text>
              )}
              {data.socialTiktok && <Text style={styles.socialHandle}>{data.socialTiktok}</Text>}
            </View>
          </View>
        </View>

        {/* Address Column */}
        <View style={styles.headerRight}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MapPinIcon size={6} />
            <Text style={styles.addressLine}> {data.address}</Text>
          </View>
          {data.storePhone && (
            <View style={styles.phoneLine}>
              <PhoneIcon size={6} />
              <Text style={styles.phoneText}> {formatPhone(data.storePhone)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ==================== CUSTOMER + INVOICE DETAILS ==================== */}
      <View style={styles.customerInvoiceRow}>
        {/* Kepada (Customer) - Left */}
        {!isQuotation && (
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Kepada :</Text>
            <Text style={styles.customerName}>{data.customerName}</Text>
            <Text style={styles.customerNik}>NIK: {data.customerNpwp || ""}</Text>
            {data.customerAddress && (
              <Text style={styles.customerAddress}>{data.customerAddress}</Text>
            )}
          </View>
        )}

        {/* Invoice Details Box - Right */}
        <View style={styles.invoiceDetailsBox}>
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>No. Invoice</Text>
            <Text style={styles.invoiceDetailSeparator}>:</Text>
            <Text style={styles.invoiceDetailValue}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>Tanggal</Text>
            <Text style={styles.invoiceDetailSeparator}>:</Text>
            <Text style={styles.invoiceDetailValue}>{data.date}</Text>
          </View>
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>No. PO</Text>
            <Text style={styles.invoiceDetailSeparator}>:</Text>
            <Text style={styles.invoiceDetailValue}>{data.poNumber || ""}</Text>
          </View>
        </View>
      </View>

      {/* ==================== ITEMS TABLE ==================== */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSeria]}>Seria</Text>
          <Text style={[styles.tableHeaderText, styles.colNamaBarang]}>Nama Barang</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colHarga]}>@Harga</Text>
          <Text style={[styles.tableHeaderText, styles.colDiskon]}>Diskon</Text>
          <Text style={[styles.tableHeaderText, styles.colTotalHarga]}>Total Harga</Text>
        </View>
        {/* Rows */}
        {data.items.map((item, index) => {
          const isLast = index === data.items.length - 1;
          return (
            <View key={index} style={isLast ? styles.tableRowLast : styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSeria]}>{item.sn}</Text>
              <Text style={[styles.tableCell, styles.colNamaBarang]}>
                {item.merk ? `${item.merk} ` : ""}
                {item.model}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>1</Text>
              <Text style={[styles.tableCell, styles.colHarga]}>{formatNumber(item.price)}</Text>
              <Text style={[styles.tableCell, styles.colDiskon]}>0</Text>
              <Text style={[styles.tableCell, styles.colTotalHarga]}>
                {formatNumber(item.price)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ==================== TERBILANG ==================== */}
      <View style={styles.terbilangSection}>
        <Text style={styles.terbilangLabel}>Terbilang :</Text>
        <Text style={styles.terbilangValue}>{terbilang(data.total)}</Text>
      </View>

      {/* ==================== MIDDLE: KETERANGAN + TOTALS ==================== */}
      <View style={styles.middleSection}>
        <View style={styles.keteranganBox}>
          <Text style={styles.keteranganLabel}>Keterangan :</Text>
          <Text style={styles.keteranganContent}>{data.notes || ""}</Text>
        </View>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sub Total</Text>
            <Text style={styles.totalValue}>{formatNumber(displaySubtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Diskon</Text>
            <Text style={styles.totalValue}>{formatNumber(displayDiscount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PPN ({displayTaxRate}%)</Text>
            <Text style={styles.totalValue}>{formatNumber(displayTax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatNumber(data.total)}</Text>
          </View>
        </View>
      </View>

      {/* ==================== BOTTOM: PEMBAYARAN | TANDA TERIMA | PERHATIAN ==================== */}
      <View style={styles.bottomSection}>
        {/* Pembayaran */}
        <View style={styles.pembayaranColumn}>
          <Text style={styles.pembayaranLabel}>Pembayaran :</Text>
          <Text style={styles.pembayaranValue}>{data.paymentMethod}</Text>
          <View style={styles.bankRow}>
            <View style={styles.bankLogo} />
            <Text style={styles.bankInfo}>BCA : 010-175-0085</Text>
          </View>
          <Text style={styles.bankHolder}>DJOKO SUBARDJO DJOHAN</Text>
        </View>

        {/* Tanda Terima */}
        <View style={styles.tandaTerimaColumn}>
          <Text style={styles.tandaTerimaLabel}>Tanda Terima</Text>
          <View style={styles.tandaTerimaSpace} />
        </View>

        {/* Perhatian */}
        <View style={styles.perhatianColumn}>
          <View style={styles.perhatianBox}>
            <Text style={styles.perhatianTitle}>PERHATIAN</Text>
            <Text style={styles.perhatianText}>
              Barang-barang yang sudah di beli tidak dapat ditukar / dikembalikan kecuali ada
              perjanjian
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Document>
      {layout === "a5-landscape" && (
        <Page size={[595, 420]} style={styles.pageA5Landscape}>
          {pageContent}
        </Page>
      )}

      {layout === "a4-portrait" && (
        <Page size="A4" style={[styles.pageA4Portrait, styles.a4PortraitPage]}>
          <View style={styles.a4PortraitTopHalf} />
          <View style={styles.a4PortraitBottomHalf}>{pageContent}</View>
        </Page>
      )}

      {layout === "a4-landscape" && (
        <Page size={[842, 595]} style={styles.pageA4Landscape}>
          {pageContent}
        </Page>
      )}
    </Document>
  );
};

export default InvoiceDocument;
