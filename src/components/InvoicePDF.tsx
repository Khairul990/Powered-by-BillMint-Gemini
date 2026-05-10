import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Invoice, InvoiceItem, BusinessSettings, DEFAULT_INVOICE_COLUMNS } from '../types';
import { formatDate } from '../lib/utils';

// Register fonts if needed, but standard ones are safe. 
// Using standard sans-serif (Helvetica) for better performance and reliability.

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  businessInfo: {
    maxWidth: 250,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'black',
    color: '#0f172a',
    marginBottom: 6,
  },
  businessDetail: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  invoiceMetaContainer: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'black',
    color: '#0f172a',
    letterSpacing: -1,
    marginBottom: 10,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  customerSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  customerTitle: {
    fontSize: 10,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#1e293b',
    letterSpacing: 1,
  },
  customerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  customerCol: {
    flex: 1,
    minWidth: '28%',
  },
  customerLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  customerValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1.3,
  },
  table: {
    width: 'auto',
    marginBottom: 25,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 35,
  },
  tableHeader: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontWeight: 'black',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
  },
  snCell: { width: '6%', textAlign: 'center' },
  nameCell: { flex: 3, textAlign: 'left', fontWeight: 'bold' },
  qtyCell: { width: '8%', textAlign: 'center' },
  rateCell: { width: '12%', textAlign: 'right' },
  amountCell: { width: '15%', textAlign: 'right', fontWeight: 'bold' },
  dynamicCell: { width: '12%', textAlign: 'center' },

  chargeTag: {
    fontSize: 7,
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    padding: '2 4',
    borderRadius: 4,
    marginRight: 4,
    marginTop: 4,
  },
  
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
    marginBottom: 40,
  },
  notesBox: {
    flex: 3,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 10,
  },
  notesList: {
    gap: 6,
  },
  notesItem: {
    flexDirection: 'row',
    gap: 6,
    fontSize: 9,
    color: '#64748b',
  },
  notesDot: {
    width: 4,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginTop: 4,
  },
  totalsBox: {
    flex: 2,
  },
  totalsCard: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '8 15',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  finalTotalLabel: {
    fontSize: 9,
    fontWeight: 'black',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'black',
    color: '#0f172a',
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '0 15 10 15',
  },
  dueCard: {
    backgroundColor: '#0f172a',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: 9,
    fontWeight: 'black',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  dueValue: {
    fontSize: 18,
    fontWeight: 'black',
    color: '#ffffff',
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBox: {
    textAlign: 'center',
    width: 200,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 8,
    fontWeight: 'black',
    textTransform: 'uppercase',
    color: '#0f172a',
    letterSpacing: 2,
  },
  thankYou: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  }
});

interface InvoicePDFProps {
  invoice: Invoice;
  items: InvoiceItem[];
  settings: BusinessSettings | null;
}

const InvoicePDF = ({ invoice, items, settings }: InvoicePDFProps) => {
  const invoiceColumns = settings?.invoiceColumns || DEFAULT_INVOICE_COLUMNS;
  const visibleColumns = [...invoiceColumns].filter(c => c.visible).sort((a,b) => a.order - b.order);

  const formatCurrencyLocal = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Document title={`Invoice-${invoice.invoiceNumber}`} author={settings?.businessName || 'Business'}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              {settings?.logoUrl ? (
                <Image src={settings.logoUrl} style={styles.logo} />
              ) : (
                <Text style={{ fontSize: 10, color: '#94a3b8' }}>Logo</Text>
              )}
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{settings?.businessName || 'K.B. Embroidery Designor'}</Text>
              <Text style={styles.businessDetail}>{settings?.businessAddress || 'DHULAGOR HOWRAH, HAJI SAHEB PARA, PIN NO - 711302'}</Text>
              <Text style={styles.businessDetail}>Email: {settings?.businessEmail || 'khairul2052007@gmail.com'}</Text>
              <Text style={styles.businessDetail}>Phone: {settings?.businessPhone || '9903591839'}</Text>
            </View>
          </View>

          <View style={styles.invoiceMetaContainer}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No.</Text>
                <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.date)}</Text>
              </View>
              <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaLabel}>Due Date</Text>
                <Text style={styles.metaValue}>{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <View style={styles.customerHeader}>
            <Text style={styles.customerTitle}>Customer Details</Text>
          </View>
          <View style={styles.customerGrid}>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Customer Name</Text>
              <Text style={styles.customerValue}>{invoice.customerName}</Text>
            </View>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Phone</Text>
              <Text style={styles.customerValue}>{invoice.customerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Customer ID</Text>
              <Text style={styles.customerValue}>CUST-{invoice.customerId?.slice(-4).toUpperCase() || 'NEW'}</Text>
            </View>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Address</Text>
              <Text style={[styles.customerValue, { fontSize: 9, color: '#64748b' }]}>{invoice.customerAddress || 'No address provided'}</Text>
            </View>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Email</Text>
              <Text style={[styles.customerValue, { fontSize: 9, color: '#64748b' }]}>{invoice.customerEmail || 'N/A'}</Text>
            </View>
            <View style={styles.customerCol}>
              <Text style={styles.customerLabel}>Payment Type</Text>
              <Text style={styles.customerValue}>Cash</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.snCell, { color: '#ffffff' }]}>S.N.</Text>
            {visibleColumns.map((col, idx) => (
              <Text 
                key={idx} 
                style={[
                  styles.tableCell, 
                  col.id === 'name' ? styles.nameCell : 
                  col.id === 'quantity' ? styles.qtyCell :
                  col.id === 'price' ? styles.rateCell :
                  col.id === 'total' ? styles.amountCell :
                  styles.dynamicCell,
                  { color: '#ffffff' }
                ]}
              >
                {col.label} {col.type === 'currency' ? '(₹)' : ''}
              </Text>
            ))}
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? { backgroundColor: '#f8fafc' } : {}]}>
              <Text style={[styles.tableCell, styles.snCell]}>{item.serialNumber || (idx + 1)}</Text>
              {visibleColumns.map((col, colIdx) => (
                <View 
                  key={colIdx} 
                  style={[
                    styles.tableCell, 
                    col.id === 'name' ? styles.nameCell : 
                    col.id === 'quantity' ? styles.qtyCell :
                    col.id === 'price' ? styles.rateCell :
                    col.id === 'total' ? styles.amountCell :
                    styles.dynamicCell
                  ]}
                >
                  {col.id === 'name' ? (
                    <View>
                      <Text>{item[col.id] || '-'}</Text>
                      {item.workCharges && item.workCharges.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {item.workCharges.map((w, wIdx) => (
                            <Text key={wIdx} style={styles.chargeTag}>{w.name}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text>
                      {col.type === 'currency' ? (item[col.id] || 0).toFixed(2) : item[col.id] || '-'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Totals & Notes */}
        <View style={styles.bottomSection}>
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes / Terms</Text>
            <View style={styles.notesList}>
              <View style={styles.notesItem}>
                <View style={styles.notesDot} />
                <Text>Please check all details before payment.</Text>
              </View>
              <View style={styles.notesItem}>
                <View style={styles.notesDot} />
                <Text>No return after payment.</Text>
              </View>
              <View style={styles.notesItem}>
                <View style={styles.notesDot} />
                <Text>Payment is due by the due date mentioned.</Text>
              </View>
              <View style={styles.notesItem}>
                <View style={styles.notesDot} />
                <Text>Thank you for your business!</Text>
              </View>
            </View>
            {invoice.notes && (
              <View style={{ marginTop: 15, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic' }}>{invoice.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrencyLocal(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>{formatCurrencyLocal(invoice.discount)}</Text>
              </View>
              <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.totalLabel}>Tax (0%)</Text>
                <Text style={styles.totalValue}>₹0.00</Text>
              </View>
              <View style={styles.finalTotalRow}>
                <Text style={styles.finalTotalLabel}>Total Amount</Text>
                <Text style={styles.finalTotalValue}>{formatCurrencyLocal(invoice.total)}</Text>
              </View>
            </View>

            <View style={styles.paidRow}>
              <Text style={[styles.totalLabel, { textTransform: 'uppercase', fontSize: 8 }]}>Amount Paid</Text>
              <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrencyLocal(invoice.paidAmount)}</Text>
            </View>

            <View style={styles.dueCard}>
              <Text style={styles.dueLabel}>Balance Due</Text>
              <Text style={styles.dueValue}>{formatCurrencyLocal(invoice.dueAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!settings?.isPremium ? (
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#0f172a', borderRadius: 2 }} />
                <Text style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Powered by BillMint</Text>
             </View>
          ) : (
            <Text style={styles.thankYou}>Generated by BillMint - Thank you!</Text>
          )}
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
