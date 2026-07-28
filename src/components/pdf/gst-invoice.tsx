import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { amountInWords, formatDate, formatNumber } from "@/lib/accounting/format";
import type { CompanySettings, Ledger, StockItem, VoucherInventoryEntry, VoucherTaxDetail } from "@/types/database";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  title: { fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 2 },
  subtitle: { fontSize: 9, textAlign: "center", color: "#444", marginBottom: 8 },
  headerBox: { border: "1pt solid #333", padding: 8, marginBottom: 8 },
  row: { flexDirection: "row" },
  colHalf: { width: "50%" },
  label: { color: "#555", fontSize: 8 },
  bold: { fontWeight: 700 },
  section: { marginBottom: 8 },
  table: { border: "1pt solid #333" },
  tr: { flexDirection: "row", borderBottom: "0.5pt solid #999" },
  thRow: { flexDirection: "row", backgroundColor: "#eee", borderBottom: "1pt solid #333" },
  th: { padding: 4, fontSize: 8, fontWeight: 700 },
  td: { padding: 4, fontSize: 8 },
  cSl: { width: "6%" },
  cDesc: { width: "34%" },
  cHsn: { width: "10%" },
  cQty: { width: "10%", textAlign: "right" },
  cRate: { width: "13%", textAlign: "right" },
  cTax: { width: "13%", textAlign: "right" },
  cAmt: { width: "14%", textAlign: "right" },
  totalsBox: { alignSelf: "flex-end", width: "45%", marginTop: 6 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  footer: { marginTop: 16, fontSize: 8, color: "#444" },
});

function rupee(n: number): string {
  return `Rs. ${formatNumber(n)}`;
}

export interface GstInvoiceData {
  company: CompanySettings;
  voucherNo: string;
  voucherDate: string;
  party: Ledger;
  isInterstate: boolean;
  lines: (VoucherInventoryEntry & { item: StockItem })[];
  taxDetails: VoucherTaxDetail[];
  subtotal: number;
  totalAmount: number;
}

export function GstInvoiceDocument({ data }: { data: GstInvoiceData }) {
  const { company, party, lines, taxDetails, subtotal, totalAmount } = data;
  const cgst = taxDetails.find((t) => t.tax_type === "CGST")?.amount ?? 0;
  const sgst = taxDetails.find((t) => t.tax_type === "SGST")?.amount ?? 0;
  const igst = taxDetails.find((t) => t.tax_type === "IGST")?.amount ?? 0;

  return (
    <Document title={`Invoice ${data.voucherNo}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{company.name}</Text>
        <Text style={styles.subtitle}>
          {company.address}, {company.city}, {company.state} - {company.pincode}
        </Text>
        <Text style={styles.subtitle}>
          Phone: {company.phone ?? "—"} {company.gstin ? `  GSTIN: ${company.gstin}` : ""}
        </Text>
        <Text style={[styles.title, { fontSize: 11, marginTop: 6 }]}>TAX INVOICE</Text>

        <View style={[styles.headerBox, styles.row]}>
          <View style={styles.colHalf}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.bold}>{party.name}</Text>
            {party.address && <Text>{party.address}</Text>}
            {party.state && <Text>{party.state}</Text>}
            {party.gstin && <Text>GSTIN: {party.gstin}</Text>}
          </View>
          <View style={styles.colHalf}>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice No: </Text>
              <Text style={styles.bold}>{data.voucherNo}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice Date: </Text>
              <Text>{formatDate(data.voucherDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Supply Type: </Text>
              <Text>{data.isInterstate ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.th, styles.cSl]}>#</Text>
            <Text style={[styles.th, styles.cDesc]}>Description</Text>
            <Text style={[styles.th, styles.cHsn]}>HSN</Text>
            <Text style={[styles.th, styles.cQty]}>Qty</Text>
            <Text style={[styles.th, styles.cRate]}>Rate</Text>
            <Text style={[styles.th, styles.cTax]}>GST %</Text>
            <Text style={[styles.th, styles.cAmt]}>Amount</Text>
          </View>
          {lines.map((l, idx) => (
            <View style={styles.tr} key={l.id}>
              <Text style={[styles.td, styles.cSl]}>{idx + 1}</Text>
              <Text style={[styles.td, styles.cDesc]}>{l.item.name}</Text>
              <Text style={[styles.td, styles.cHsn]}>{l.item.hsn_code ?? "—"}</Text>
              <Text style={[styles.td, styles.cQty]}>{formatNumber(l.quantity)}</Text>
              <Text style={[styles.td, styles.cRate]}>{formatNumber(l.rate)}</Text>
              <Text style={[styles.td, styles.cTax]}>{formatNumber(l.item.gst_rate)}%</Text>
              <Text style={[styles.td, styles.cAmt]}>{formatNumber(l.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{rupee(subtotal)}</Text>
          </View>
          {cgst > 0 && (
            <View style={styles.totalsRow}>
              <Text>CGST</Text>
              <Text>{rupee(cgst)}</Text>
            </View>
          )}
          {sgst > 0 && (
            <View style={styles.totalsRow}>
              <Text>SGST</Text>
              <Text>{rupee(sgst)}</Text>
            </View>
          )}
          {igst > 0 && (
            <View style={styles.totalsRow}>
              <Text>IGST</Text>
              <Text>{rupee(igst)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTop: "1pt solid #333", fontWeight: 700 }]}>
            <Text>Grand Total</Text>
            <Text>{rupee(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount in Words</Text>
          <Text>{amountInWords(totalAmount)}</Text>
        </View>

        {(company.bank_name || company.bank_account_no) && (
          <View style={styles.section}>
            <Text style={styles.label}>Bank Details</Text>
            <Text>
              {company.bank_name} {company.bank_account_no ? `A/c: ${company.bank_account_no}` : ""} {company.bank_ifsc ? `IFSC: ${company.bank_ifsc}` : ""}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>{company.invoice_terms}</Text>
          <View style={[styles.row, { justifyContent: "space-between", marginTop: 24 }]}>
            <Text>Receiver&apos;s Signature</Text>
            <Text>For {company.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
