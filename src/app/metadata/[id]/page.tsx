"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MetadataForm {
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  description: string;
  keywords: string;
  seriesName: string;
  seriesNumber: string;
  isbn: string;
  copyrightYear: string;
}

interface OptimizedMetadata {
  optimizedDescription: string;
  suggestedKeywords: string[];
  suggestedCategories: string[];
  exportText: string;
}

export default function MetadataPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [formData, setFormData] = useState<MetadataForm>({
    title: "",
    subtitle: "",
    author: "",
    genre: "fiction",
    description: "",
    keywords: "",
    seriesName: "",
    seriesNumber: "",
    isbn: "",
    copyrightYear: new Date().getFullYear().toString(),
  });

  const [optimized, setOptimized] = useState<OptimizedMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptimize = async () => {
    if (!formData.title || !formData.description) {
      setError("Please fill in title and description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/metadata/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to optimize metadata");
      }

      const data = await res.json();
      setOptimized(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to optimize metadata"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExport = () => {
    if (optimized) {
      navigator.clipboard.writeText(optimized.exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            LayoutForge
          </Link>
          <Link href="/upload" className="text-sm text-slate-600 hover:text-slate-900">
            Back to Upload
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Publishing Metadata Editor
          </h1>
          <p className="text-slate-600">
            Fill in your book information. We'll optimize your description and
            generate everything you need for Amazon KDP submission.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Form */}
          <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Book Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter your book title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="Optional subtitle"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Author Name *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Genre
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fiction">Fiction</option>
                <option value="mystery">Mystery/Thriller</option>
                <option value="romance">Romance</option>
                <option value="scifi">Science Fiction</option>
                <option value="fantasy">Fantasy</option>
                <option value="nonfiction">Non-Fiction</option>
                <option value="self-help">Self-Help</option>
                <option value="business">Business</option>
                <option value="biography">Biography</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Book Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Write your book's back cover description / blurb..."
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="e.g., dragons, fantasy, epic adventure"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Series Name
              </label>
              <input
                type="text"
                name="seriesName"
                value={formData.seriesName}
                onChange={handleInputChange}
                placeholder="e.g., The Chronicles of..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Book # in Series
                </label>
                <input
                  type="number"
                  name="seriesNumber"
                  value={formData.seriesNumber}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Copyright Year
                </label>
                <input
                  type="number"
                  name="copyrightYear"
                  value={formData.copyrightYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ISBN (optional)
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="Leave blank if unknown"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full mt-6 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Optimizing..." : "Optimize for KDP"}
            </button>
          </div>

          {/* Results */}
          <div>
            {optimized ? (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  KDP Ready Export
                </h2>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Optimized Description
                  </h3>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                    {optimized.optimizedDescription}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Suggested Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {optimized.suggestedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Suggested Categories
                  </h3>
                  <div className="space-y-1">
                    {optimized.suggestedCategories.map((cat, i) => (
                      <div key={i} className="text-sm text-slate-700">
                        ✓ {cat}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Copy-Paste for KDP
                  </h3>
                  <textarea
                    value={optimized.exportText}
                    readOnly
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs text-slate-700"
                  />
                </div>

                <button
                  onClick={handleCopyExport}
                  className="w-full rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 transition-colors"
                >
                  {copied ? "✓ Copied to Clipboard!" : "Copy for KDP"}
                </button>

                <button
                  onClick={() => setOptimized(null)}
                  className="w-full rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Edit & Regenerate
                </button>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200 text-center py-12">
                <p className="text-slate-500">
                  Fill in your book information and click "Optimize for KDP" to
                  get:
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>✓ AI-optimized description with keywords</li>
                  <li>✓ Suggested KDP categories</li>
                  <li>✓ Ready-to-paste export for Amazon</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
