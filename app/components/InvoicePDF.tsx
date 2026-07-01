import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";
import { terbilang } from "../utils/terbilang";

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Page
  pageA4Portrait: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.3,
    padding: 0,
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
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 3,
    marginBottom: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // Logo Column
  logoColumn: {
    width: 120,
  },
  logo: {
    width: 100,
  },
  // Title Column
  titleColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.1,
  },
  socialUnderTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    justifyContent: "center",
  },
  // Address Column
  addressColumn: {
    width: 140,
  },
  addressLine: {
    fontSize: 5,
    textAlign: "right",
    lineHeight: 1.1,
  },
  phoneLine: {
    fontSize: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 1,
  },
  phoneIcon: {
    width: 5,
    height: 5,
    marginRight: 1,
  },
  phoneText: {
    fontSize: 5,
  },
  // Social Icons
  socialIcon: {
    width: 5,
    height: 5,
    backgroundColor: "#e5e7eb",
    borderRadius: 1,
    marginRight: 2,
  },
  socialHandle: {
    fontSize: 4,
    marginRight: 3,
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
    marginBottom: 4,
  },
  customerSection: {
    flex: 1,
  },
  invoiceDetailsBox: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
    width: 220,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  invoiceDetailLabel: {
    width: 65,
    fontSize: 7,
    fontWeight: "bold",
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
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#000000",
    width: 572,
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
  tableCellView: {
    padding: 4,
    justifyContent: "center",
  },
  tableCell: {
    fontSize: 7,
  },
  // Column widths using fixed points for A5 landscape (595 - 24 padding = 571pt available)
  // Seria 15%≈86, Nama Barang 35%≈200, Qty 8%≈46, @Harga 18%≈103, Diskon 10%≈57, Total Harga 14%≈80
  colSeria: { width: 86 },
  colNamaBarang: { width: 200 },
  colQty: { width: 46 },
  colHarga: { width: 103 },
  colDiskon: { width: 57 },
  colTotalHarga: { width: 80 },

  // ============================================================
  // Terbilang
  // ============================================================
  terbilangSection: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
    marginBottom: 4,
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
    marginBottom: 4,
    gap: 6,
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
  quantity?: number; // for Surat Jalan / Penarikan / Batch Input
}

export type InvoiceDocumentKind = "invoice" | "quotation" | "surat-jalan" | "surat-penarikan";

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

  // Penarikan fields
  recipient?: string; // Penarik (person or department)
  reason?: string; // Alasan (e.g. "Rusak", "Lainnya: ...")

  // Items
  items: InvoiceItem[];

  // Totals (only used by invoice/quotation)
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

export type InvoiceLayout = "a4-portrait";

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

export const InvoiceDocument: React.FC<{
  data: InvoiceData;
  layout?: InvoiceLayout;
  kind?: InvoiceDocumentKind;
}> = ({ data, layout = "a4-portrait", kind }) => {
  // Derive flags from `kind`, falling back to legacy `isQuotation` on data
  const resolvedKind: InvoiceDocumentKind = kind ?? (data.isQuotation ? "quotation" : "invoice");
  const isInvoice = resolvedKind === "invoice";
  const isQuotation = resolvedKind === "quotation";
  const isSuratJalan = resolvedKind === "surat-jalan";
  const isSuratPenarikan = resolvedKind === "surat-penarikan";
  // Surat Jalan & Surat Penarikan have no prices, totals, or payment
  const hidePrices = isSuratJalan || isSuratPenarikan;
  const hideTotals = isSuratJalan || isSuratPenarikan;
  const hideTerbilang = isSuratJalan || isSuratPenarikan;
  const hidePembayaran = isSuratJalan || isSuratPenarikan;

  const displayDiscount = data.discount || 0;

  // Title text
  const titleLines: string[] = (() => {
    if (isInvoice) return ["Faktur", "Penjualan"];
    if (isQuotation) return ["Quotation"];
    if (isSuratJalan) return ["Surat", "Jalan"];
    if (isSuratPenarikan) return ["Surat", "Penarikan Barang"];
    return ["Faktur", "Penjualan"];
  })();

  // For Surat Jalan, quantity shown is 1 (one row per SN, like Invoice/Quotation).
  // For Surat Penarikan, the per-row quantity may be > 1.
  const showQuantityPerRow = isSuratPenarikan;

  const pageContent = (
    <>
      {/* ==================== HEADER ==================== */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Logo Column */}
          <View style={styles.logoColumn}>
            <Image src="/logo.png" style={styles.logo} />
          </View>

          {/* Title Column */}
          <View style={styles.titleColumn}>
            {titleLines.map((line, idx) => (
              <Text key={idx} style={styles.invoiceTitle}>
                {line}
              </Text>
            ))}
          </View>

          {/* Address Column */}
          <View style={styles.addressColumn}>
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-end" }}
            >
              <MapPinIcon size={5} />
              <Text style={styles.addressLine}> {data.address}</Text>
            </View>
            {data.storePhone && (
              <View style={styles.phoneLine}>
                <PhoneIcon size={5} />
                <Text style={styles.phoneText}> {formatPhone(data.storePhone)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ==================== CUSTOMER + INVOICE DETAILS ==================== */}
      <View style={styles.customerInvoiceRow}>
        {/* Customer slot OR Penarik+Alasan (+ optional Customer/PO) */}
        {isSuratPenarikan ? (
          <View style={styles.customerSection}>
            <View style={{ flexDirection: "row", marginBottom: 1 }}>
              <Text style={[styles.customerLabel, { width: 50 }]}>Penarik :</Text>
              <Text style={styles.customerName}>{data.recipient || "-"}</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.customerLabel, { width: 50 }]}>Alasan :</Text>
              <Text style={[styles.customerNik, { flex: 1 }]}>{data.reason || "-"}</Text>
            </View>
            {/* Optional customer/PO lines: only render when the
                withdrawal is tied to a customer-side document. Most
                Penarikan events are internal and leave both empty. */}
            {data.customerName ? (
              <View style={{ flexDirection: "row", marginTop: 1 }}>
                <Text style={[styles.customerLabel, { width: 50 }]}>Customer :</Text>
                <Text style={[styles.customerNik, { flex: 1 }]}>{data.customerName}</Text>
              </View>
            ) : null}
            {data.poNumber ? (
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.customerLabel, { width: 50 }]}>No. PO :</Text>
                <Text style={[styles.customerNik, { flex: 1 }]}>{data.poNumber}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          !isQuotation && (
            <View style={styles.customerSection}>
              <Text style={styles.customerLabel}>Kepada :</Text>
              <Text style={styles.customerName}>{data.customerName}</Text>
              <Text style={styles.customerNik}>NIK: {data.customerNpwp || ""}</Text>
              {data.customerAddress && (
                <Text style={styles.customerAddress}>{data.customerAddress}</Text>
              )}
            </View>
          )
        )}

        {/* Invoice Details Box - Right */}
        <View style={styles.invoiceDetailsBox}>
          {/* Invoice/Surat Jalan/Penarikan number - hidden for quotations (they only have PO Number) */}
          {!isQuotation && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>
                {isSuratJalan
                  ? "No. Surat Jalan"
                  : isSuratPenarikan
                    ? "No. Penarikan"
                    : "No. Invoice"}
              </Text>
              <Text style={styles.invoiceDetailSeparator}>:</Text>
              <Text style={styles.invoiceDetailValue}>{data.invoiceNumber}</Text>
            </View>
          )}
          <View style={styles.invoiceDetailRow}>
            <Text style={styles.invoiceDetailLabel}>Tanggal</Text>
            <Text style={styles.invoiceDetailSeparator}>:</Text>
            <Text style={styles.invoiceDetailValue}>{data.date}</Text>
          </View>
          {/* PO row: shown on every kind that carries a PO. For SPB the
              field is optional and the row is hidden when empty. */}
          {(data.poNumber || !isSuratPenarikan) && (
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>No. PO</Text>
              <Text style={styles.invoiceDetailSeparator}>:</Text>
              <Text style={styles.invoiceDetailValue}>{data.poNumber || ""}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ==================== ITEMS TABLE ==================== */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <View style={styles.colSeria}>
            <Text style={styles.tableHeaderText}>Serial</Text>
          </View>
          <View style={styles.colNamaBarang}>
            <Text style={styles.tableHeaderText}>Nama Barang</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={[styles.tableHeaderText, { textAlign: "center" }]}>Qty</Text>
          </View>
          {hidePrices ? null : (
            <>
              <View style={styles.colHarga}>
                <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>@Harga</Text>
              </View>
              <View style={styles.colDiskon}>
                <Text style={[styles.tableHeaderText, { textAlign: "center" }]}>Diskon</Text>
              </View>
              <View style={styles.colTotalHarga}>
                <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Total Harga</Text>
              </View>
            </>
          )}
        </View>
        {/* Rows */}
        {data.items.map((item, index) => {
          const isLast = index === data.items.length - 1;
          return (
            <View key={index} style={isLast ? styles.tableRowLast : styles.tableRow}>
              <View style={[styles.tableCellView, styles.colSeria]}>
                <Text style={[styles.tableCell, { maxWidth: 78 }]}>
                  {item.sn?.startsWith("NOSN-") ? "" : item.sn}
                </Text>
              </View>
              <View style={[styles.tableCellView, styles.colNamaBarang]}>
                <Text style={[styles.tableCell, { maxWidth: 192 }]}>
                  {item.merk ? `${item.merk} ` : ""}
                  {item.model}
                </Text>
              </View>
              <View style={[styles.tableCellView, styles.colQty]}>
                <Text style={[styles.tableCell, { textAlign: "center" }]}>
                  {item.quantity || 1}
                </Text>
              </View>
              {hidePrices ? null : (
                <>
                  <View style={[styles.tableCellView, styles.colHarga]}>
                    <Text style={[styles.tableCell, { textAlign: "right" }]}>
                      {formatNumber(item.price)}
                    </Text>
                  </View>
                  <View style={[styles.tableCellView, styles.colDiskon]}>
                    <Text style={[styles.tableCell, { textAlign: "center" }]}>0</Text>
                  </View>
                  <View style={[styles.tableCellView, styles.colTotalHarga]}>
                    <Text style={[styles.tableCell, { textAlign: "right" }]}>
                      {formatNumber(item.price * (item.quantity || 1))}
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* ==================== TERBILANG (only when prices exist) ==================== */}
      {hideTerbilang ? null : (
        <View style={styles.terbilangSection}>
          <Text style={styles.terbilangLabel}>Terbilang :</Text>
          <Text style={styles.terbilangValue}>{terbilang(data.total)}</Text>
        </View>
      )}

      {/* ==================== MIDDLE: KETERANGAN (+ TOTALS if applicable) ==================== */}
      <View style={styles.middleSection}>
        <View style={styles.keteranganBox}>
          <Text style={styles.keteranganLabel}>Keterangan :</Text>
          <Text style={styles.keteranganContent}>{data.notes || ""}</Text>
        </View>
        {hideTotals ? null : (
          <View style={styles.totalsBox}>
            {data.taxEnabled && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Sub Total</Text>
                  <Text style={styles.totalValue}>{formatNumber(data.subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Diskon</Text>
                  <Text style={styles.totalValue}>{formatNumber(displayDiscount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>PPN ({data.taxRate || 0}%)</Text>
                  <Text style={styles.totalValue}>{formatNumber(data.tax)}</Text>
                </View>
              </>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatNumber(data.total)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ==================== BOTTOM: PEMBAYARAN | TANDA TERIMA | PERHATIAN ==================== */}
      <View style={styles.bottomSection}>
        {/* Pembayaran — hidden for SJ/Penarikan */}
        {hidePembayaran ? null : (
          <View style={styles.pembayaranColumn}>
            <Text style={styles.pembayaranLabel}>Pembayaran :</Text>
            <Text style={styles.pembayaranValue}>{data.paymentMethod}</Text>
            <View style={styles.bankRow}>
              <View style={styles.bankLogo} />
              <Text style={styles.bankInfo}>BCA : 010-5577-988</Text>
            </View>
            <Text style={styles.bankHolder}>DJOKO SUBARDJO DJOHAN</Text>
          </View>
        )}

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
      <Page size="A4" style={[styles.pageA4Portrait, styles.a4PortraitPage]}>
        <View style={styles.a4PortraitTopHalf} />
        <View style={styles.a4PortraitBottomHalf}>{pageContent}</View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;
