/**
 * Server-side KDP compliance report PDF (@react-pdf/renderer).
 * Letter size, flexbox-only layout, editorial / premium audit aesthetic.
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CheckerReportData } from "@/lib/checkerReportPdfMapper";

const COL = {
  success: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
  ink: "#1F2937",
  muted: "#6B7280",
  line: "#E5E7EB",
  surface: "#F3F4F6",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: COL.ink,
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COL.line,
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 16, color: "#EA580C" },
  brandSuffix: { fontFamily: "Helvetica-Bold", fontSize: 16, color: COL.ink },
  brandGreen: { fontFamily: "Helvetica-Bold", fontSize: 16, color: COL.success },
  metaRight: { fontFamily: "Courier", fontSize: 9, color: COL.muted, textAlign: "right", maxWidth: 280 },
  heroWrap: { alignItems: "center", marginBottom: 20 },
  heroCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COL.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroCircleWarn: { backgroundColor: COL.warning },
  heroGrade: { fontFamily: "Helvetica-Bold", fontSize: 48, color: COL.white },
  heroGradeWarn: { color: COL.ink },
  heroLabel: { fontFamily: "Helvetica-Bold", fontSize: 14, color: COL.ink, marginBottom: 4, textAlign: "center" },
  heroSub: { fontFamily: "Courier", fontSize: 10, color: COL.muted, textAlign: "center" },
  strip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stripPass: { backgroundColor: COL.success },
  stripFail: { backgroundColor: COL.warning },
  stripText: { fontFamily: "Helvetica-Bold", fontSize: 12, color: COL.white },
  stripTextDark: { fontFamily: "Helvetica-Bold", fontSize: 12, color: COL.ink },
  stripMono: { fontFamily: "Courier", fontSize: 10, color: COL.white },
  stripMonoDark: { fontFamily: "Courier", fontSize: 10, color: COL.ink },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: COL.ink,
    marginBottom: 12,
    marginTop: 8,
  },
  scanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 28,
    padding: 14,
    backgroundColor: COL.surface,
    borderRadius: 6,
  },
  scanCell: { flex: 1, minWidth: 0 },
  scanIcon: { fontFamily: "Helvetica-Bold", fontSize: 10, color: COL.muted, marginBottom: 4 },
  scanVal: { fontFamily: "Helvetica", fontSize: 10, color: COL.ink },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COL.surface,
    borderBottomWidth: 1,
    borderBottomColor: COL.line,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 9, color: COL.ink, textTransform: "uppercase" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COL.line, paddingVertical: 8, paddingHorizontal: 8 },
  trAlt: { backgroundColor: "#FAFAFA" },
  td: { fontFamily: "Helvetica", fontSize: 9, color: COL.ink, flex: 1 },
  tdMono: { fontFamily: "Courier", fontSize: 9, color: COL.ink, flex: 1, textAlign: "right" as const },
  statusCell: { width: 44, alignItems: "center" as const },
  issueCard: {
    borderWidth: 1,
    borderColor: COL.line,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
  },
  issueAccent: { width: 4, borderRadius: 2, marginRight: 12, minHeight: 40 },
  issueBody: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" },
  pill: {
    fontFamily: "Courier",
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: COL.surface,
    borderRadius: 10,
    color: COL.muted,
  },
  issueTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, color: COL.ink, marginBottom: 6 },
  issueDesc: { fontFamily: "Helvetica", fontSize: 10, color: COL.muted, marginBottom: 8 },
  issueHow: { fontFamily: "Helvetica", fontSize: 10, color: COL.ink },
  cta: {
    marginTop: 20,
    padding: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 8,
  },
  ctaTitle: { fontFamily: "Helvetica-Bold", fontSize: 13, color: "#1E3A8A", marginBottom: 8 },
  ctaBody: { fontFamily: "Helvetica", fontSize: 10, color: COL.ink, marginBottom: 6 },
  footerFixed: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    fontFamily: "Courier",
    fontSize: 8,
    color: COL.muted,
    textAlign: "center",
  },
});

function statusIcon(status: "pass" | "fail" | "warning"): string {
  if (status === "pass") return "✅";
  if (status === "fail") return "❌";
  return "⚠️";
}

function severityColor(s: CheckerReportData["issues"][0]["severity"]): string {
  if (s === "blocker") return COL.critical;
  if (s === "warning") return COL.warning;
  return COL.muted;
}

function formatScanDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function PageHeader({ data }: { data: CheckerReportData }) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={styles.brand}>manu</Text>
        <Text style={styles.brandSuffix}>2</Text>
        <Text style={styles.brandGreen}>print</Text>
      </View>
      <View>
        <Text style={styles.metaRight}>{formatScanDate(data.scanDate)}</Text>
        <Text style={styles.metaRight}>{data.filename}</Text>
      </View>
    </View>
  );
}

function PageFooter() {
  return (
    <Text
      style={styles.footerFixed}
      render={({ pageNumber, totalPages }) => {
        const y = new Date().getFullYear();
        return `Verified by manu2print · © ${y} · Page ${pageNumber} of ${totalPages}`;
      }}
      fixed
    />
  );
}

function HeroBlock({ data }: { data: CheckerReportData }) {
  const pass = data.verdict === "pass";
  return (
    <View style={styles.heroWrap}>
      <View style={pass ? styles.heroCircle : [styles.heroCircle, styles.heroCircleWarn]}>
        <Text style={pass ? styles.heroGrade : [styles.heroGrade, styles.heroGradeWarn]}>{data.grade}</Text>
      </View>
      <Text style={styles.heroLabel}>{pass ? "KDP Ready" : "Needs fixes before upload"}</Text>
      <Text style={styles.heroSub}>
        Readiness {data.score}/100 · Approval likelihood {data.approvalLikelihood}% · Risk {data.riskLevel}
      </Text>
    </View>
  );
}

function VerdictStrip({ data }: { data: CheckerReportData }) {
  const pass = data.verdict === "pass";
  return (
    <View style={[styles.strip, pass ? styles.stripPass : styles.stripFail]}>
      <Text style={pass ? styles.stripText : styles.stripTextDark}>{pass ? "PASS" : "ACTION REQUIRED"}</Text>
      <Text style={pass ? styles.stripMono : styles.stripMonoDark}>
        {data.blockers} blockers · {data.warnings} warnings · {data.info} info
      </Text>
    </View>
  );
}

function ScanContextBlock({ data }: { data: CheckerReportData }) {
  const { scanContext } = data;
  const bleedLabel = scanContext.bleed ? "Bleed rules: OK" : "Bleed: review";
  return (
    <View>
      <Text style={styles.sectionTitle}>Scan context</Text>
      <View style={styles.scanRow}>
        <View style={styles.scanCell}>
          <Text style={styles.scanIcon}>📖 Format</Text>
          <Text style={styles.scanVal}>{scanContext.format}</Text>
        </View>
        <View style={styles.scanCell}>
          <Text style={styles.scanIcon}>⬜ Bleed</Text>
          <Text style={styles.scanVal}>{bleedLabel}</Text>
        </View>
        <View style={styles.scanCell}>
          <Text style={styles.scanIcon}>⚫ Interior</Text>
          <Text style={styles.scanVal}>{scanContext.colorMode}</Text>
        </View>
        <View style={styles.scanCell}>
          <Text style={styles.scanIcon}>📏 Trim</Text>
          <Text style={styles.scanVal}>{scanContext.trimSize}</Text>
        </View>
      </View>
    </View>
  );
}

function ChecklistTable({ data }: { data: CheckerReportData }) {
  if (!data.checklist.length) return null;
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={styles.sectionTitle}>Upload readiness checklist</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1 }]}>Check</Text>
        <Text style={[styles.th, { width: 56, textAlign: "right" }]}>Status</Text>
      </View>
      {data.checklist.map((row, i) => (
        <View key={i} style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}>
          <Text style={[styles.td, { flex: 1 }]}>{row.item}</Text>
          <Text style={[styles.td, { width: 56, textAlign: "right", fontFamily: "Courier" }]}>
            {statusIcon(row.status)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SpecTableBlock({ data }: { data: CheckerReportData }) {
  if (!data.specTable.length) return null;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>KDP spec comparison</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1.1 }]}>Requirement</Text>
        <Text style={[styles.th, { flex: 1 }]}>Your file</Text>
        <Text style={[styles.th, { flex: 1 }]}>KDP required</Text>
        <Text style={[styles.th, { width: 52, textAlign: "center" }]}> </Text>
      </View>
      {data.specTable.map((row, i) => (
        <View key={i} style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}>
          <Text style={[styles.td, { flex: 1.1 }]}>{row.requirement}</Text>
          <Text style={[styles.tdMono, { flex: 1, textAlign: "left" }]}>{row.yourFile}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{row.kdpRequired}</Text>
          <View style={styles.statusCell}>
            <Text style={{ fontFamily: "Courier", fontSize: 10 }}>{statusIcon(row.status)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function IssueCard({ issue }: { issue: CheckerReportData["issues"][0] }) {
  const color = severityColor(issue.severity);
  const pages = issue.pages.length ? issue.pages.join(", ") : "—";
  return (
    <View wrap={false} style={styles.issueCard}>
      <View style={[styles.issueAccent, { backgroundColor: color }]} />
      <View style={styles.issueBody}>
        <View style={styles.badgeRow}>
          <Text style={{ fontFamily: "Courier", fontSize: 8, color, textTransform: "uppercase" }}>
            {issue.severity}
          </Text>
          <Text style={styles.pill}>{issue.fixTime}</Text>
          <Text style={styles.pill}>Pages: {pages}</Text>
        </View>
        <Text style={styles.issueTitle}>{issue.title}</Text>
        <Text style={styles.issueDesc}>{issue.description}</Text>
        <Text style={styles.issueHow}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>How to fix: </Text>
          {issue.howToFix}
        </Text>
      </View>
    </View>
  );
}

function NextStepsBlock() {
  return (
    <View style={styles.cta}>
      <Text style={styles.ctaTitle}>Next step: upload-ready confidence</Text>
      <Text style={styles.ctaBody}>
        Apply the fixes in this report, export a fresh PDF from your layout app, then run one final check before uploading to KDP.
      </Text>
      <Text style={{ fontFamily: "Courier", fontSize: 9, color: "#1D4ED8" }}>
        https://www.manu2print.com/kdp-pdf-checker
      </Text>
    </View>
  );
}

const ISSUES_PER_PAGE = 4;

function chunkIssues<T>(arr: T[], size: number): T[][] {
  if (!arr.length) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function CheckerReportPdfDocument({ data }: { data: CheckerReportData }) {
  const issueChunks = chunkIssues(data.issues, ISSUES_PER_PAGE);
  const hasIssues = issueChunks.length > 0;

  return (
    <Document title={`KDP Compliance Report — ${data.filename}`} author="manu2print" subject="KDP PDF Checker">
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />
        <HeroBlock data={data} />
        <VerdictStrip data={data} />
        <ScanContextBlock data={data} />
        <ChecklistTable data={data} />
        <SpecTableBlock data={data} />
        {!hasIssues ? <NextStepsBlock /> : null}
        <PageFooter />
      </Page>

      {issueChunks.map((chunk, idx) => (
        <Page key={`issues-${idx}`} size="LETTER" style={styles.page}>
          <PageHeader data={data} />
          <Text style={styles.sectionTitle}>{idx === 0 ? "Issues" : "Issues (continued)"}</Text>
          {chunk.map((issue, j) => (
            <IssueCard key={`${issue.title}-${j}`} issue={issue} />
          ))}
          {idx === issueChunks.length - 1 ? <NextStepsBlock /> : null}
          <PageFooter />
        </Page>
      ))}
    </Document>
  );
}
