"use client";

import { useState, useMemo } from "react";
import {
  ROYALTY_TRIM_SIZES,
  ROYALTY_RATES,
  getPrintCostUsd,
  getRoyaltyUsd,
  MIN_PAGES,
  MAX_PAGES,
  type RoyaltyTrimId,
} from "@/lib/royaltyCalc";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

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
    <ToolPageShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-m2p-ink mb-2">
          KDP Trim Size Comparison — Compare Print Sizes for Amazon KDP
        </h1>
        <p className="text-m2p-muted mb-3">
          Compare print cost and royalty across KDP trim sizes. Same page count and list price.
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed">
          Choosing the correct trim size is only one part of KDP compliance.
          Your interior layout must match it exactly — margins, bleed, and fonts are checked separately.
        </p>

        <div className="rounded-xl border border-m2p-border bg-white p-6 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Page count</label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber || MIN_PAGES)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">List price (USD)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="9.99"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Royalty rate</label>
              <select
                value={rateId}
                onChange={(e) => setRateId(e.target.value as "60" | "35")}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {ROYALTY_RATES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-m2p-border bg-white overflow-hidden mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-m2p-border">
                  <th className="text-left py-3 px-4 text-m2p-ink font-medium">Trim size</th>
                  <th className="text-right py-3 px-4 text-m2p-ink font-medium">Print cost</th>
                  <th className="text-right py-3 px-4 text-m2p-ink font-medium">Royalty/sale</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ trim, printCost, royalty }) => (
                  <tr key={trim.id} className="border-b border-m2p-border last:border-0">
                    <td className="py-3 px-4 text-m2p-ink">{trim.name}</td>
                    <td className="py-3 px-4 text-right text-m2p-muted">${printCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-m2p-orange font-semibold">${royalty.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-m2p-muted mb-2">
          US B&amp;W paperback estimates. No data sent to server.
        </p>

        <KdpConversionBridge />

        <KdpConversionBridge />
      </div>
    </ToolPageShell>
  );
}
