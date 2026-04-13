import React from "react";
import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getStored } from "@/lib/storage";
import { buildCheckerReportPdfData } from "@/lib/checkerReportPdfMapper";
import { CheckerReportPdfDocument } from "@/lib/checkerReportPdfDocument";

export const runtime = "nodejs";

function sanitizeFilenameBase(name: string): string {
  const base = (name || "report").trim();
  const ascii = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]+/g, "_")
    .replace(/["'`\\/%]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return ascii.slice(0, 120) || "KDP_Report";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ downloadId: string }> },
) {
  const { downloadId } = await context.params;
  if (!downloadId || typeof downloadId !== "string" || downloadId.length > 128) {
    return Response.json({ error: "Invalid id", message: "A valid download id is required." }, { status: 400 });
  }

  const meta = await getStored(downloadId);
  if (!meta) {
    return Response.json({ error: "Not found", message: "This download was not found or has expired." }, { status: 404 });
  }

  if (!meta.payment_confirmed) {
    return Response.json(
      { error: "Payment required", message: "Purchase this report to download the PDF." },
      { status: 402 },
    );
  }

  let reportData;
  try {
    reportData = buildCheckerReportPdfData(meta);
  } catch (e) {
    console.error("[checker-report-pdf] map failed", e);
    return Response.json({ error: "Report unavailable", message: "Could not read the checker report for this download." }, { status: 500 });
  }

  if (!reportData) {
    return Response.json(
      { error: "Report unavailable", message: "No checker processing report is available for this download." },
      { status: 500 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(CheckerReportPdfDocument, { data: reportData }) as Parameters<typeof renderToBuffer>[0],
    );
  } catch (e) {
    console.error("[checker-report-pdf] render failed", e);
    return Response.json({ error: "PDF generation failed", message: "The report could not be generated. Try again later." }, { status: 500 });
  }

  const safe = sanitizeFilenameBase(reportData.filename);
  const disposition = `attachment; filename="KDP_Compliance_Report_${safe}.pdf"`;

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuffer.length),
      "Content-Disposition": disposition,
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
