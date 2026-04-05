"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, CreditCard, Shield, LogOut, ChevronRight, Camera } from "lucide-react";
import Link from "next/link";

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
}

export function SettingsPanel({ user, firstName, setFirstName, saving, profileMsg, onSave, onSignOut, avatarUrl, avatarUploading, onAvatarChange }: Props) {
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="d-card-elevated border-[var(--d-border-strong)] p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-5" style={{ color: "var(--d-fg)" }}>
          <User className="w-4 h-4" style={{ color: "var(--d-fg-muted)" }} />
          Profile
        </h3>
        <form onSubmit={onSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar — click to upload */}
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
              {/* Camera overlay on hover */}
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
              <p className="text-sm font-medium" style={{ color: "var(--d-fg)" }}>Profile photo</p>
              <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>Click to upload · JPG, PNG or WebP · max 2MB</p>
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
            <button type="submit" disabled={saving} className="d-cta d-cta-md disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="d-card-elevated divide-y overflow-hidden border-[var(--d-border-strong)]" style={{ borderColor: "var(--d-border)" }}>
        <SettingRow icon={CreditCard} title="Purchase History" description="View all your scan reports and receipts" href="/my-orders" />
        <SettingRow icon={Shield} title="Help & FAQ" description="Answers to common questions" href="/faq" />
      </Card>

      <Card className="d-card-elevated border-[var(--d-border-strong)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>Sign out</p>
            <p className="text-xs" style={{ color: "var(--d-fg-muted)" }}>End your session on this device</p>
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
        <p className="text-sm font-bold" style={{ color: "var(--d-fg)" }}>{title}</p>
        <p className="text-xs leading-snug" style={{ color: "var(--d-fg-muted)" }}>{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" style={{ color: "var(--d-primary)" }} />
    </Link>
  );
}
