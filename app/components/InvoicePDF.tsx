import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1e293b',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 700,
  },
  address: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
  },
  invoiceNumber: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  customerSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 600,
  },
  value: {
    fontSize: 10,
    marginTop: 2,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 600,
    color: '#475569',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowText: {
    fontSize: 9,
  },
  summary: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 150,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 600,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 150,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  staffInfo: {
    marginTop: 4,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
});

interface InvoiceItem {
  model: string;
  sn: string;
  price: number;
}

interface InvoiceData {
  storeName: string;
  address: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  staffName: string;
  paymentMethod: string;
}

export const InvoiceDocument: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{data.storeName}</Text>
        <Text style={styles.address}>{data.address}</Text>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
        <Text style={styles.invoiceNumber}>{data.invoiceNumber} • {data.date}</Text>
      </View>

      <View style={styles.customerSection}>
        <Text style={styles.label}>PELANGGAN</Text>
        <Text style={styles.value}>{data.customerName}</Text>
        {data.customerPhone && (
          <Text style={styles.value}>{data.customerPhone}</Text>
        )}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>ITEM</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>SN</Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>QTY</Text>
          <Text style={[styles.tableHeaderText, styles.col4]}>HARGA</Text>
          <Text style={[styles.tableHeaderText, styles.col5]}>TOTAL</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableRowText, styles.col1]}>{item.model}</Text>
            <Text style={[styles.tableRowText, styles.col2]}>{item.sn}</Text>
            <Text style={[styles.tableRowText, styles.col3]}>1</Text>
            <Text style={[styles.tableRowText, styles.col4]}>{item.price.toLocaleString('id-ID')}</Text>
            <Text style={[styles.tableRowText, styles.col5]}>{item.price.toLocaleString('id-ID')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{data.subtotal.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>PPN ({data.tax > 0 ? '11%' : '0%'})</Text>
          <Text style={styles.summaryValue}>{data.tax.toLocaleString('id-ID')}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{data.total.toLocaleString('id-ID')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Terima kasih telah berbelanja di {data.storeName}</Text>
        <Text style={styles.staffInfo}>Kasir: {data.staffName} • {data.paymentMethod}</Text>
      </View>
    </Page>
  </Document>
);

export default InvoiceDocument;
