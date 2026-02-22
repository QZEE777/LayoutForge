"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            LayoutForge
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.primaryEmailAddress?.emailAddress}</span>
            <a href="/sign-out" className="text-sm text-blue-600 hover:underline">
              Sign Out
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Account Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div>
                <p className="text-slate-500">Member Since</p>
                <p className="font-medium text-slate-900">
                  {user?.createdAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-4">Subscription</h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-500 text-sm">Current Plan</p>
                <p className="text-2xl font-bold text-blue-600 capitalize">
                  {subscriptionTier}
                </p>
              </div>
              <button className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-4">API Key</h2>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded font-mono text-xs break-all">
                {showApiKey ? apiKey : "••••••••••••••••"}
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-900 mb-4">Usage This Month</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500 text-sm">PDFs Generated</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Analyses Run</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">API Calls</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Storage Used</p>
              <p className="text-2xl font-bold text-slate-900">0 MB</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href="/upload"
            className="rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Start New Project
          </Link>
          <Link
            href="/account/billing"
            className="rounded-lg border border-slate-300 px-6 py-3 text-center font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Billing & Plans
          </Link>
        </div>
      </main>
    </div>
  );
}
