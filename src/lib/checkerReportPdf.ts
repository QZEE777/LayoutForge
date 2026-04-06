/**
 * Client-side branded PDF for KDP compliance (checker) report.
 * Header, subheader, Manny watermark, content, footer on every page.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10;
const FONT_SIZE_SM = 9;
const HEADER_SIZE = 16;
const SUBHEADER_SIZE = 11;
const FOOTER_SIZE = 8;
const WATERMARK_SIZE = 220; // width in pt for centered Manny avatar

const ORANGE = rgb(240 / 255, 90 / 255, 40 / 255);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.55, 0.55, 0.55);

export interface CheckerReportForPdf {
  scanDate?: string;
  fileNameScanned?: string;
  kdpPassProbability?: number;
  riskLevel?: string;
  uploadChecklist?: Array<{ check: string; status: "pass" | "warning" | "fail" }>;
  specTable?: Array<{ requirement: string; yourFile: string; kdpRequired: string; status: "pass" | "warning" | "fail" }>;
  issuesEnriched?: Array<{ humanMessage: string; fixDifficulty: string; page?: number }>;
  issues?: string[];
  recommendations?: string[];
  upsellBridge?: string;
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  pageCount?: number;
  fileSizeMB?: number;
  recommendedGutterInches?: number;
}

const STATUS_EMOJI: Record<string, string> = { pass: "✅", warning: "⚠️", fail: "❌" };

function addFooter(page: ReturnType<PDFDocument["getPages"]>[0], font: Awaited<ReturnType<PDFDocument["embedFont"]>>, y: number) {
  page.drawText("© manu2print.com — Built for indie authors", {
    x: MARGIN,
    y,
    size: FOOTER_SIZE,
    font,
    color: LIGHT_GRAY,
  });
}

/** Generate branded PDF report. Call from browser; pass imageBytes from fetch(/MANNY AVATAR.png). */
export async function generateCheckerReportPdf(
  report: CheckerReportForPdf,
  cleanedFilename: string,
  imageBytes: Uint8Array
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pngImage = await doc.embedPng(imageBytes);
  const scale = WATERMARK_SIZE / pngImage.width;
  const wmW = WATERMARK_SIZE;
  const wmH = pngImage.height * scale;
  const wmX = (PAGE_W - wmW) / 2;
  const wmY = (PAGE_H - wmH) / 2;

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // Watermark (first page only, 8% opacity)
  page.drawImage(pngImage, {
    x: wmX,
    y: wmY,
    width: wmW,
    height: wmH,
    opacity: 0.08,
  });

  // Header
  page.drawText("manu2print.com", {
    x: MARGIN,
    y,
    size: HEADER_SIZE,
    font: fontBold,
    color: ORANGE,
  });
  y -= HEADER_SIZE + 4;

  const subheaderLines: string[] = [];
  if (report.scanDate) subheaderLines.push(`Scan: ${new Date(report.scanDate).toLocaleString()}`);
  if (cleanedFilename) subheaderLines.push(cleanedFilename);
  if (subheaderLines.length) {
    page.drawText(subheaderLines.join(" · "), {
      x: MARGIN,
      y,
      size: SUBHEADER_SIZE,
      font,
      color: GRAY,
    });
    y -= SUBHEADER_SIZE + 12;
  } else {
    y -= 8;
  }

  function nextPageIfNeeded(need: number) {
    if (y < MARGIN + need + FOOTER_SIZE + 10) {
      addFooter(page, font, MARGIN);
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function drawLine(text: string, opts?: { bold?: boolean; size?: number }) {
    nextPageIfNeeded(LINE_HEIGHT);
    const size = opts?.size ?? FONT_SIZE;
    page.drawText(text, {
      x: MARGIN,
      y,
      size,
      font: opts?.bold ? fontBold : font,
      color: GRAY,
    });
    y -= size + 2;
  }

  // Score
  if (report.kdpPassProbability != null && report.riskLevel) {
    drawLine(`KDP Approval Likelihood: ${report.kdpPassProbability}% — Risk Level: ${report.riskLevel}`, { bold: true });
    y -= 4;
  }

  // Checklist
  if (report.uploadChecklist?.length) {
    drawLine("Upload readiness checklist", { bold: true });
    y -= 2;
    for (const item of report.uploadChecklist) {
      const emoji = STATUS_EMOJI[item.status] ?? "—";
      drawLine(`${emoji} ${item.check}`, { size: FONT_SIZE_SM });
    }
    y -= 8;
  }

  // Spec table
  if (report.specTable?.length) {
    drawLine("KDP spec comparison", { bold: true });
    y -= 2;
    for (const row of report.specTable) {
      const emoji = STATUS_EMOJI[row.status] ?? "—";
      drawLine(`${row.requirement}: ${row.yourFile} | KDP: ${row.kdpRequired} ${emoji}`, { size: FONT_SIZE_SM });
    }
    y -= 8;
  }

  // Summary line
  drawLine(`Trim: ${report.trimDetected ?? "—"} | Match KDP trim: ${report.trimMatchKDP ? "Yes" : "No"}${report.kdpTrimName ? ` (${report.kdpTrimName})` : ""} | Pages: ${report.pageCount ?? "—"}${report.fileSizeMB != null ? ` | ${report.fileSizeMB} MB` : ""}`, { size: FONT_SIZE_SM });
  y -= 8;

  // Issues
  const issues = report.issuesEnriched?.length
    ? report.issuesEnriched.map((i) => (i.page != null ? `[p.${i.page}] ` : "") + i.humanMessage)
    : report.issues ?? [];
  if (issues.length) {
    drawLine("Issues", { bold: true });
    y -= 2;
    for (const msg of issues) {
      const lines = msg.length > 90 ? [msg.slice(0, 90), msg.slice(90)] : [msg];
      for (const line of lines) {
        drawLine(`• ${line}`, { size: FONT_SIZE_SM });
      }
    }
    y -= 8;
  }

  // Recommendations
  if (report.recommendations?.length) {
    drawLine("Recommendations", { bold: true });
    y -= 2;
    for (const r of report.recommendations) {
      drawLine(`• ${r}`, { size: FONT_SIZE_SM });
    }
    y -= 8;
  }

  // Upsell / CTA line (guard against retired "coming soon" copy)
  const sanitizedUpsellBridge =
    report.upsellBridge &&
    !/coming soon|waitlist|formatter/i.test(report.upsellBridge)
      ? report.upsellBridge
      : "";
  if (sanitizedUpsellBridge) {
    nextPageIfNeeded(LINE_HEIGHT * 2);
    drawLine(sanitizedUpsellBridge, { size: FONT_SIZE_SM });
  }

  addFooter(page, font, MARGIN);

  return doc.save();
}
