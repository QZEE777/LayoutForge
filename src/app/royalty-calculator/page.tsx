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

export default function RoyaltyCalculatorPage() {
  const [trimId, setTrimId] = useState<RoyaltyTrimId>("6x9");
  const [pageCount, setPageCount] = useState(300);
  const [listPrice, setListPrice] = useState("9.99");
  const [rateId, setRateId] = useState<"60" | "35">("60");

  const listPriceNum = useMemo(() => {
    const n = parseFloat(listPrice.replace(/,/g, "."));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [listPrice]);

  const pages = useMemo(() => {
    const n = Math.round(Number(pageCount));
    return Number.isFinite(n) ? Math.max(MIN_PAGES, Math.min(MAX_PAGES, n)) : MIN_PAGES;
  }, [pageCount]);

  const rate = useMemo(() => ROYALTY_RATES.find((r) => r.id === rateId)?.value ?? 0.6, [rateId]);
  const printCost = useMemo(() => getPrintCostUsd(trimId, pages), [trimId, pages]);
  const royalty = useMemo(
    () => getRoyaltyUsd(listPriceNum, printCost, rate),
    [listPriceNum, printCost, rate]
  );

  return (
    <div className="min-h-screen bg-m2p-ivory">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-m2p-ivory/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-gold">
              <svg className="w-4 h-4" fill="none" stroke="#0F0D0B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-cream">
              <span className="font-serif">manu</span>
              <span className="font-sans">2print</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/platform/kdp" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Tools
            </Link>
            <Link href="/" className="text-sm font-medium text-brand-cream hover:text-brand-gold transition-colors">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Image src="/MANNY AVATAR.png" alt="Manny" width={28} height={28} style={{ borderRadius: "50%" }} />
          <span><span style={{ color: "#F05A28", fontWeight: "bold" }}>manu</span><span style={{ color: "#4cd964", fontWeight: "bold" }}>2print</span></span>
        </div>
        <h1 className="font-bebas text-3xl sm:text-4xl tracking-wide text-brand-cream mb-2">
          KDP Royalty Calculator
        </h1>
        <p className="font-sans text-brand-muted mb-8">
          Estimate your earnings per sale. Uses US paperback B&W print costs; actual KDP costs may vary by marketplace.
        </p>

        <div className="rounded-xl border border-brand-cardHover bg-brand-card p-6 mb-8">
          <div className="space-y-5">
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Trim size</label>
              <select
                value={trimId}
                onChange={(e) => setTrimId(e.target.value as RoyaltyTrimId)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {ROYALTY_TRIM_SIZES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">
                Page count ({MIN_PAGES}–{MAX_PAGES})
              </label>
              <input
                type="number"
                min={MIN_PAGES}
                max={MAX_PAGES}
                value={pageCount}
                onChange={(e) => setPageCount(e.target.valueAsNumber || MIN_PAGES)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">List price (USD)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="9.99"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="w-full rounded-lg border border-brand-cardHover px-4 py-2.5 bg-m2p-ivory font-sans text-sm text-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-sans text-sm font-medium text-brand-cream mb-2">Royalty rate</label>
              <div className="flex gap-4">
                {ROYALTY_RATES.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rate"
                      value={r.id}
                      checked={rateId === r.id}
                      onChange={() => setRateId(r.id as "60" | "35")}
                      className="text-brand-gold focus:ring-brand-gold"
                    />
                    <span className="font-sans text-sm text-brand-cream">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-l-4 border-brand-gold border border-brand-cardHover bg-brand-card p-6">
          <h2 className="font-bebas text-xl tracking-wide text-brand-cream mb-4">Result</h2>
          <dl className="space-y-2 font-sans text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-muted">Print cost (est.)</dt>
              <dd className="text-brand-cream font-medium">${printCost.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-muted">List price</dt>
              <dd className="text-brand-cream font-medium">${listPriceNum.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-cardHover">
              <dt className="text-brand-cream font-medium">Royalty per sale</dt>
              <dd className="text-brand-gold font-bold text-lg">${royalty.toFixed(2)}</dd>
            </div>
          </dl>
          {listPriceNum > 0 && listPriceNum < printCost && (
            <p className="mt-3 font-sans text-sm text-amber-400">
              List price is below estimated print cost — increase price to earn a royalty.
            </p>
          )}
        </div>

        <p className="mt-6 font-sans text-xs text-brand-muted">
          This is an estimate. Amazon KDP sets actual print costs by marketplace and paper type. Check KDP&apos;s pricing page for your territory.
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
