"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, CreditCard, Shield, LogOut, ChevronRight, Camera, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AccountPortalData } from "@/lib/accountPortalData";

interface Props {
  user: { name: string; email: string };
  firstName: string;
  setFirstName: (v: string) => void;
  saving: boolean;
  profileMsg: { type: "ok" | "err"; text: string } | null;
  onSave: (e: React.FormEvent) => void;
  onSignOut: () => void;
  avatarUrl?: string;
  avatarUploading?: boolean;
  onAvatarChange?: (file: File) => void;
  /** e.g. /dashboard?tab=settings&orders=1 after /my-orders redirect */
  initialExpandPurchaseHistory?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    author_pack: "Author Pack (6 credits)",
    indie_pack: "Indie Pack (14 credits)",
    pro_pack: "Pro Pack (30 credits)",
    scan_used: "Credit used",
    share_reward: "Share reward",
  };
  return map[source] ?? source;
}

function toolLabel(tool: string) {
  const map: Record<string, string> = {
    "kdp-pdf-checker": "KDP PDF Checker",
    kdp_pdf_checker: "KDP PDF Checker",
    "kdp-formatter": "KDP Formatter",
  };
  return map[tool] ?? tool ?? "Purchase";
}

function PurchaseHistoryInline({ data }: { data: AccountPortalData }) {
  const { credits, payments } = data;
  const grants = credits.ledger.filter((r) => r.credits > 0);
  const deductions = credits.ledger.filter((r) => r.credits < 0);

  return (
    <div className="d-purchase-inline space-y-5 px-3 py-4 sm:px-4">
      <div
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--d-border-strong)", background: "var(--d-card)" }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
            Scan credits
          </p>
          <p className="text-2xl font-black tabular-nums" style={{ color: "var(--d-primary)" }}>
            {credits.remaining}
          </p>
          <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
            {credits.total} granted · {credits.used} used
          </p>
        </div>
        <Link href="/kdp-pdf-checker" className="d-cta d-cta-md w-full shrink-0 justify-center sm:w-auto">
          Use a credit
        </Link>
      </div>

      {data.subscriptions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
            Subscription
          </p>
          <ul className="space-y-2">
            {data.subscriptions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--d-border)", background: "var(--d-card)" }}
              >
                <span className="font-semibold" style={{ color: "var(--d-fg)" }}>
                  {s.plan}
                </span>
                <span className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                  {" "}
                  · {s.status} · {formatDate(s.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
            Purchases
          </p>
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                style={{ borderColor: "var(--d-border)", background: "var(--d-card)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--d-fg)" }}>
                    {toolLabel(p.tool)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                    {p.payment_type === "single_use" ? "Single scan" : sourceLabel(p.payment_type)} · {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color: "var(--d-fg)" }}>
                    {formatAmount(p.amount)}
                  </p>
                  <span
                    className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "rgba(76,217,100,0.15)", color: "#15803d" }}
                  >
                    {p.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {credits.ledger.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--d-fg-muted)" }}>
            Credit activity
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2" style={{ borderColor: "var(--d-border)", background: "var(--d-card)" }}>
            {grants.map((row, i) => (
              <div key={`g-${i}`} className="flex justify-between gap-2 px-2 py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--d-fg)" }}>
                    {sourceLabel(row.source)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                    {formatDate(row.created_at)}
                  </p>
                </div>
                <span className="shrink-0 font-bold" style={{ color: "#15803d" }}>
                  +{row.credits}
                </span>
              </div>
            ))}
            {deductions.map((row, i) => (
              <div key={`d-${i}`} className="flex justify-between gap-2 px-2 py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium" style={{ color: "var(--d-fg)" }}>
                    Credit used
                  </p>
                  <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                    {formatDate(row.created_at)}
                  </p>
                </div>
                <span className="shrink-0 font-bold" style={{ color: "var(--d-fg-muted)" }}>
                  {row.credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && credits.total === 0 && data.subscriptions.length === 0 && (
        <p className="text-center text-sm" style={{ color: "var(--d-fg-muted)" }}>
          No purchases yet for this email.
        </p>
      )}

      <p className="text-center text-xs" style={{ color: "var(--d-fg-muted)" }}>
        Need another email?{" "}
        <Link href="/account" className="d-link font-semibold">
          Open account portal (email code) →
        </Link>
      </p>
    </div>
  );
}

export function SettingsPanel({
  user,
  firstName,
  setFirstName,
  saving,
  profileMsg,
  onSave,
  onSignOut,
  avatarUrl,
  avatarUploading,
  onAvatarChange,
  initialExpandPurchaseHistory = false,
}: Props) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseData, setPurchaseData] = useState<AccountPortalData | null>(null);

  const loadPurchaseHistory = useCallback(async () => {
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const res = await fetch("/api/dashboard/purchase-history");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPurchaseError(typeof json.error === "string" ? json.error : "Could not load history.");
        return;
      }
      if (!json.ok || typeof json.email !== "string" || !json.credits) {
        setPurchaseError("Unexpected response.");
        return;
      }
      setPurchaseData({
        email: json.email,
        payments: json.payments ?? [],
        subscriptions: json.subscriptions ?? [],
        betaAccess: json.betaAccess ?? [],
        credits: json.credits,
      });
    } catch {
      setPurchaseError("Network error. Try again.");
    } finally {
      setPurchaseLoading(false);
    }
  }, []);

  const autoExpandRef = useRef(false);
  useEffect(() => {
    if (!initialExpandPurchaseHistory || autoExpandRef.current) return;
    autoExpandRef.current = true;
    setPurchaseOpen(true);
    void loadPurchaseHistory();
  }, [initialExpandPurchaseHistory, loadPurchaseHistory]);

  const togglePurchase = useCallback(() => {
    setPurchaseOpen((o) => {
      const next = !o;
      if (next && purchaseData === null && !purchaseLoading) void loadPurchaseHistory();
      return next;
    });
  }, [loadPurchaseHistory, purchaseData, purchaseLoading]);

  return (
    <div className="d-animate-in mx-auto max-w-2xl space-y-5">
      <div className="d-hero-intro">
        <p className="font-bebas text-2xl tracking-wide text-[var(--d-fg)]">Account</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--d-fg-muted)" }}>
          Profile, receipts, and help — all in one place.
        </p>
      </div>
      <Card className="d-card-hero border-[var(--d-border-strong)] p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--d-fg)" }}>
          <User className="w-4 h-4" style={{ color: "var(--d-fg-muted)" }} />
          Profile
        </h3>
        <form onSubmit={onSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0 group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{ background: avatarUrl ? "transparent" : "linear-gradient(135deg, #F05A28, #4cd964)" }}
                title="Change profile photo"
              >
                {avatarUploading ? (
                  <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              {!avatarUploading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <Camera className="w-5 h-5 text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && onAvatarChange) onAvatarChange(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--d-fg)" }}>
                Profile photo
              </p>
              <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
                Click to upload · JPG, PNG or WebP · max 2MB
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--d-fg)" }}>
                First Name
              </label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Alex" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--d-fg)" }}>
                Email
              </label>
              <Input value={user.email} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
          </div>
          {profileMsg && (
            <p className="text-sm font-medium" style={{ color: profileMsg.type === "ok" ? "#10b981" : "#ef4444" }}>
              {profileMsg.text}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="d-cta d-cta-md disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="d-card-quiet overflow-hidden border-[var(--d-border-strong)]" style={{ borderColor: "var(--d-border)" }}>
        <div>
          <button
            type="button"
            onClick={togglePurchase}
            className="group flex w-full items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-[var(--d-muted)]/70 sm:px-4 sm:py-3.5"
            aria-expanded={purchaseOpen}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/[0.04]"
              style={{ background: "var(--d-muted)" }}
            >
              <CreditCard className="h-4 w-4" style={{ color: "var(--d-fg-muted)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>
                Purchase history
              </p>
              <p className="text-xs leading-snug" style={{ color: "var(--d-fg-muted)" }}>
                Receipts, credits, and subscriptions — stays in your dashboard
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 opacity-60 transition-transform duration-200",
                purchaseOpen && "rotate-180"
              )}
              style={{ color: "var(--d-primary)" }}
              aria-hidden
            />
          </button>
          {purchaseOpen && (
            <>
              {purchaseLoading && (
                <div className="border-t px-4 py-8 text-center text-sm" style={{ borderColor: "var(--d-border)", color: "var(--d-fg-muted)" }}>
                  Loading…
                </div>
              )}
              {purchaseError && !purchaseLoading && (
                <div className="border-t space-y-2 px-4 py-4 text-center" style={{ borderColor: "var(--d-border)" }}>
                  <p className="text-sm" style={{ color: "#ef4444" }}>
                    {purchaseError}
                  </p>
                  <button type="button" onClick={() => void loadPurchaseHistory()} className="d-link text-sm font-semibold">
                    Retry
                  </button>
                </div>
              )}
              {purchaseData && !purchaseLoading && <PurchaseHistoryInline data={purchaseData} />}
            </>
          )}
        </div>

        <div className="border-t" style={{ borderColor: "var(--d-border)" }}>
          <SettingRow icon={Shield} title="Help & FAQ" description="Answers to common questions" href="/faq" />
        </div>
      </Card>

      <Card className="d-card-quiet border-[var(--d-border-strong)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>
              Sign out
            </p>
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
              End your session on this device
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--d-border)] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:border-[var(--d-fg-muted)] hover:bg-[var(--d-muted)]"
            style={{ color: "var(--d-fg-muted)" }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, href }: { icon: React.ElementType; title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-2 py-3 transition-colors hover:bg-[var(--d-muted)]/70 sm:px-4 sm:py-3.5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/[0.04]" style={{ background: "var(--d-muted)" }}>
        <Icon className="h-4 w-4" style={{ color: "var(--d-fg-muted)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>
          {title}
        </p>
        <p className="text-xs leading-snug" style={{ color: "var(--d-fg-muted)" }}>
          {description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--d-primary)" }} />
    </Link>
  );
}
