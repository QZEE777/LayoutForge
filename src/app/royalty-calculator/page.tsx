"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ROYALTY_TRIM_SIZES,
  ROYALTY_RATES,
  PAPER_COLOR_OPTIONS,
  getPrintCostUsd,
  getRoyaltyUsd,
  MIN_PAGES,
  MAX_PAGES,
  type RoyaltyTrimId,
  type PaperColorId,
} from "@/lib/royaltyCalc";
import ToolPageShell from "@/components/ToolPageShell";
import KdpConversionBridge from "@/components/KdpConversionBridge";

export default function RoyaltyCalculatorPage() {
  const [trimId, setTrimId] = useState<RoyaltyTrimId>("6x9");
  const [paperColorId, setPaperColorId] = useState<PaperColorId>("bw-white");
  const [pageCount, setPageCount] = useState(300);
  const [listPrice, setListPrice] = useState("9.99");
  const [rateId, setRateId] = useState<"60" | "35">("60");
  const [hasInteracted, setHasInteracted] = useState(false);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  const listPriceNum = useMemo(() => {
    const n = parseFloat(listPrice.replace(/,/g, "."));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [listPrice]);

  const pages = useMemo(() => {
    const n = Math.round(Number(pageCount));
    return Number.isFinite(n) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, n)) : MIN_PAGES;
  }, [pageCount]);

  const rate = useMemo(() => ROYALTY_RATES.find((r) => r.id === rateId)?.value ?? 0.6, [rateId]);
  const printCost = useMemo(() => getPrintCostUsd(trimId, pages, paperColorId), [trimId, pages, paperColorId]);
  const royalty = useMemo(
    () => getRoyaltyUsd(listPriceNum, printCost, rate),
    [listPriceNum, printCost, rate]
  );

  return (
    <ToolPageShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-bebas tracking-wide text-m2p-ink mb-2 text-center">
          <span className="block text-3xl sm:text-4xl">KDP Royalty Calculator</span>
          <span className="block text-xl sm:text-2xl text-m2p-muted mt-1">
            Estimate Your Earnings Per Sale
          </span>
        </h1>
        <p className="text-m2p-muted mb-3 text-center text-sm leading-relaxed">
          <span className="block">Estimate your earnings per sale based on trim size,</span>
          <span className="block">page count, list price, royalty rate, and paper color.</span>
        </p>
        <p className="text-m2p-muted text-sm mt-2 mb-5 leading-relaxed text-center">
          <span className="block">Estimates royalty based on print cost.</span>
          <span className="block">Does not check whether your PDF meets KDP formatting requirements.</span>
        </p>

        <div className="rounded-xl border-2 bg-white p-6 mb-5" style={{ borderColor: "#2D6A2D" }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Trim size</label>
              <select
                value={trimId}
                onChange={(e) => { setTrimId(e.target.value as RoyaltyTrimId); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {ROYALTY_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Interior ink &amp; paper</label>
              <select
                value={paperColorId}
                onChange={(e) => { setPaperColorId(e.target.value as PaperColorId); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              >
                {PAPER_COLOR_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              {paperColorId === "color" && (
                <p className="text-xs text-amber-600 mt-1">
                  Color printing costs ~$0.07/page vs $0.012/page for B&amp;W — price your book accordingly.
                </p>
              )}
              {(paperColorId === "bw-white" || paperColorId === "bw-cream") && (
                <p className="text-xs text-m2p-muted mt-1">
                  White and cream paper cost the same per page on KDP US.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">
                Page count ({MIN_PAGES}–{MAX_PAGES})
              </label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => { setPageCount(e.target.valueAsNumber || MIN_PAGES); markInteracted(); }}
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
                onChange={(e) => { setListPrice(e.target.value); markInteracted(); }}
                className="w-full rounded-lg border border-m2p-border px-4 py-2.5 bg-m2p-ivory text-sm text-m2p-ink focus:outline-none focus:ring-2 focus:ring-m2p-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-m2p-ink mb-2">Royalty rate</label>
              <div className="flex gap-4">
                {ROYALTY_RATES.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rate"
                      value={r.id}
                      checked={rateId === r.id}
                      onChange={() => { setRateId(r.id as "60" | "35"); markInteracted(); }}
                      className="text-m2p-orange focus:ring-m2p-orange"
                    />
                    <span className="text-sm text-m2p-ink">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-m2p-orange border border-m2p-border bg-white p-6 mb-5">
          <h2 className="font-bebas text-xl tracking-wide text-m2p-ink mb-4">Result</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-m2p-muted">Print cost (est.)</dt>
              <dd className="text-m2p-ink font-medium">${printCost.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-m2p-muted">List price</dt>
              <dd className="text-m2p-ink font-medium">${listPriceNum.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-m2p-border">
              <dt className="text-m2p-ink font-medium">Royalty per sale</dt>
              <dd className="text-m2p-orange font-bold text-lg">${royalty.toFixed(2)}</dd>
            </div>
          </dl>
          {listPriceNum > 0 && listPriceNum < printCost && (
            <p className="mt-3 text-sm text-amber-600">
              List price is below estimated print cost — increase price to earn a royalty.
            </p>
          )}
        </div>

        <p className="text-xs text-m2p-muted mb-5 text-center">
          <span className="block">Estimates based on KDP US marketplace rates.</span>
          <span className="block">Actual costs vary by marketplace and KDP pricing updates.</span>
          <span className="block">Always verify on KDP&apos;s pricing page before publishing.</span>
        </p>

        <div className="mt-5 text-center">
          <p className="text-xs text-m2p-muted font-semibold mb-2 uppercase tracking-wide">
            Related free tools
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/spine-calculator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Spine Width Calculator →
            </Link>
            <Link
              href="/trim-size-comparison"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Trim Size Comparison →
            </Link>
            <Link
              href="/page-count-estimator"
              className="inline-flex items-center rounded-full bg-[#2D6A2D] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1A3A2A] transition-colors"
            >
              Page Count Estimator →
            </Link>
          </div>
        </div>

        {hasInteracted && <KdpConversionBridge />}
      </div>
    </ToolPageShell>
  );
}
