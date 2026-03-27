"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, CreditCard, Shield, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Affiliate {
  paypal_email: string | null;
  wise_email: string | null;
}

interface Props {
  user: { name: string; email: string };
  affiliate: Affiliate | null;
  firstName: string;
  setFirstName: (v: string) => void;
  saving: boolean;
  profileMsg: { type: "ok" | "err"; text: string } | null;
  onSave: (e: React.FormEvent) => void;
  onSignOut: () => void;
}

export function SettingsPanel({ user, affiliate, firstName, setFirstName, saving, profileMsg, onSave, onSignOut }: Props) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--d-fg)" }}>
          <User className="w-4 h-4" style={{ color: "var(--d-fg-muted)" }} />
          Profile
        </h3>
        <form onSubmit={onSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #F05A28, #4cd964)" }}>
              {initials}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--d-fg)" }}>First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Alex" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--d-fg)" }}>Email</label>
              <Input value={user.email} readOnly className="opacity-60 cursor-not-allowed" />
            </div>
          </div>
          {profileMsg && (
            <p className="text-sm font-medium" style={{ color: profileMsg.type === "ok" ? "#10b981" : "#ef4444" }}>
              {profileMsg.text}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#F05A28" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>

      {affiliate && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--d-fg)" }}>Partner Payouts</h3>
          <div className="space-y-3 text-sm mb-4">
            {[
              { label: "PayPal email", value: affiliate.paypal_email ?? "—" },
              { label: "Wise email",   value: affiliate.wise_email   ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span style={{ color: "var(--d-fg-muted)" }}>{label}</span>
                <span className="font-medium" style={{ color: "var(--d-fg)" }}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>
            Update via the{" "}
            <Link href="/partners" className="underline" style={{ color: "#F05A28" }}>Partners portal</Link>.
          </p>
        </Card>
      )}

      <Card className="divide-y" style={{ borderColor: "var(--d-border)" }}>
        <SettingRow icon={CreditCard} title="Purchase History" description="View all your scan reports and receipts" href="/my-orders" />
        <SettingRow icon={Shield} title="Security" description="Manage your sign-in options" href="/auth" />
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--d-fg)" }}>Sign Out</p>
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>Sign out of this device</p>
          </div>
          <button onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-colors hover:bg-[var(--d-muted)]"
            style={{ borderColor: "var(--d-border)", color: "var(--d-fg-muted)" }}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({ icon: Icon, title, description, href }: { icon: React.ElementType; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 hover:bg-[var(--d-muted)]/50 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--d-muted)" }}>
        <Icon className="w-4 h-4" style={{ color: "var(--d-fg-muted)" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--d-fg)" }}>{title}</p>
        <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>{description}</p>
      </div>
      <ChevronRight className="w-4 h-4" style={{ color: "var(--d-fg-muted)" }} />
    </Link>
  );
}
