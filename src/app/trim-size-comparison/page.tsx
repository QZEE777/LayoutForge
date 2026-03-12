"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import FreeToolCta from "@/components/FreeToolCta";
import {
  ROYALTY_TRIM_SIZES,
  ROYALTY_RATES,
  getPrintCostUsd,
  getRoyaltyUsd,
  MIN_PAGES,
  MAX_PAGES,
  type RoyaltyTrimId,
} from "@/lib/royaltyCalc";

function clampPages(n: number): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, v)) : MIN_PAGES;
}

function safeListPrice(s: string): number {
  const n = parseFloat(String(s).replace(/,/g, "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function TrimSizeComparisonPage() {
  const [pageCount, setPageCount] = useState(300);
  const [listPrice, setListPrice] = useState("9.99");
  const [rateId, setRateId] = useState<"60" | "35">("60");

  const pages = useMemo(() => clampPages(pageCount), [pageCount]);
  const listPriceNum = useMemo(() => safeListPrice(listPrice), [listPrice]);
  const rate = useMemo(() => ROYALTY_RATES.find((r) => r.id === rateId)?.value ?? 0.6, [rateId]);

  const rows = useMemo(
    () =>
      ROYALTY_TRIM_SIZES.map((trim) => {
        const printCost = getPrintCostUsd(trim.id, pages);
        const royalty = getRoyaltyUsd(listPriceNum, printCost, rate);
        return { trim, printCost, royalty };
      }),
    [pages, listPriceNum, rate]
  );

  return (
    <div className="min-h-screen bg-m2p-ivory">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-m2p-ivory/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brave">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-amazon-navy">
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">Tools</Link>
            <Link href="/platform/kdp" className="text-sm font-medium text-amazon-navy hover:text-brave transition-colors">Amazon KDP</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-amazon-navy mb-2">
          Trim Size Comparison
        </h1>
        <p className="font-sans text-soft-muted mb-8">
          Compare print cost and royalty across KDP trim sizes. Same page count and list price.
        </p>

        <div className="rounded-xl border border-soft-border bg-white p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-sans text-sm font-medium text-amazon-navy mb-2">Page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber || MIN_PAGES)}
                className="w-full rounded-lg border border-soft-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-amazon-navy focus:outline-none focus:ring-2 focus:ring-brave"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-amazon-navy mb-2">List price (USD)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="9.99"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="w-full rounded-lg border border-soft-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-amazon-navy focus:outline-none focus:ring-2 focus:ring-brave"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-amazon-navy mb-2">Royalty rate</label>
              <select
                value={rateId}
                onChange={(e) => setRateId(e.target.value as "60" | "35")}
                className="w-full rounded-lg border border-soft-border px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-amazon-navy focus:outline-none focus:ring-2 focus:ring-brave"
              >
                {ROYALTY_RATES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-soft-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="border-b border-soft-border">
                  <th className="text-left py-3 px-4 text-amazon-navy font-medium">Trim size</th>
                  <th className="text-right py-3 px-4 text-amazon-navy font-medium">Print cost</th>
                  <th className="text-right py-3 px-4 text-amazon-navy font-medium">Royalty/sale</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ trim, printCost, royalty }) => (
                  <tr key={trim.id} className="border-b border-soft-border last:border-0">
                    <td className="py-3 px-4 text-amazon-navy">{trim.name}</td>
                    <td className="py-3 px-4 text-right text-soft-muted">${printCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-brave font-semibold">${royalty.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 font-sans text-xs text-soft-muted">
          US B&W paperback estimates. No data sent to server.
        </p>

        <FreeToolCta
          description="Format your manuscript for KDP print. Trim size, bleed, print-ready PDF."
          href="/kdp-formatter"
          buttonText="Try KDP Formatter"
        />
        <p className="text-center text-m2p-muted text-xs mt-8">© manu2print.com — Built for indie authors</p>
      </main>
    </div>
  );
}
